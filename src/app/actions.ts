"use server";

import { randomBytes } from "crypto";
import { Role, SubmissionStatus, Track, VoteMode } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, createSession, requireAdmin, requireUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ActionResult, toActionError } from "@/lib/actions/result";
import { canSubmit } from "@/lib/contest/rules";
import { prisma } from "@/lib/db";
import { layoutNavigationTag } from "@/lib/layout-navigation";
import { getInviteRequiredSetting, setInviteRequiredSetting } from "@/lib/site-settings";
import { deleteImageUpload } from "@/lib/storage/uploads";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readStringList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .flatMap((value) => (typeof value === "string" ? value.split(/[，,]/) : []))
    .map((value) => value.trim())
    .filter(Boolean);
}

function makeSlug(title: string) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "contest"}-${Date.now()}`;
}

function readBoolean(formData: FormData, key: string) {
  return readString(formData, key) === "on";
}

function readDate(formData: FormData, key: string) {
  const value = readString(formData, key);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${key} is invalid.`);
  return date;
}

function readPositiveInt(formData: FormData, key: string, fallback: number) {
  const value = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getTrackVoteLimit(contest: {
  voteMode: VoteMode;
  sfwDailyVoteLimit: number;
  nsfwDailyVoteLimit: number;
  sfwTotalVoteLimit: number;
  nsfwTotalVoteLimit: number;
}, track: Track) {
  if (contest.voteMode === VoteMode.DAILY_POOL) {
    return track === Track.NSFW ? contest.nsfwDailyVoteLimit : contest.sfwDailyVoteLimit;
  }
  return track === Track.NSFW ? contest.nsfwTotalVoteLimit : contest.sfwTotalVoteLimit;
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { end, start };
}

function redirectWithError(pathname: string, message: string): never {
  redirect(`${pathname}?error=${encodeURIComponent(message)}`);
}

async function actionResult(task: () => Promise<void>): Promise<ActionResult> {
  try {
    await task();
    return { ok: true };
  } catch (error) {
    return { error: toActionError(error), errorId: Date.now(), ok: false };
  }
}

function revalidateLayoutNavigation() {
  revalidateTag(layoutNavigationTag, "max");
}

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxUploadBytes = 18 * 1024 * 1024;
const maxImagePixels = 16_000_000;
const maxImageSide = 6_000;

function assertUploadImageIsSafe(file: File, buffer: Buffer, dimensions?: { height: number; width: number }) {
  if (!allowedImageTypes.has(file.type)) throw new Error("只支持 PNG、JPEG 或 WebP 图片。");
  if (buffer.length > maxUploadBytes) throw new Error("图片文件过大，请压缩到 18MB 以内后再上传。");
  if (!dimensions) throw new Error("无法识别图片尺寸，请换用 PNG、JPEG 或 WebP 图片。");
  const pixels = dimensions.width * dimensions.height;
  if (dimensions.width > maxImageSide || dimensions.height > maxImageSide || pixels > maxImagePixels) {
    throw new Error("图片尺寸过大，请压缩到最长边 6000px 以内且总像素不超过 1600 万后再上传。");
  }
}

export async function bootstrapAdmin(formData: FormData) {
  const users = await prisma.user.count();
  if (users > 0) throw new Error("Bootstrap is already complete.");

  const qq = readString(formData, "qq");
  const nickname = readString(formData, "nickname") || `QQ ${qq}`;
  const password = readString(formData, "password");
  if (!qq || !password) throw new Error("QQ and password are required.");

  const user = await prisma.user.create({
    data: {
      nickname,
      passwordHash: await hashPassword(password),
      qq,
      role: Role.ADMIN,
    },
    select: { avatarUrl: true, id: true, nickname: true, qq: true, role: true },
  });
  await prisma.whitelistEntry.upsert({ where: { qq }, update: {}, create: { qq } });
  await createSession(user);
  redirect("/admin");
}

export async function registerUser(formData: FormData) {
  const qq = readString(formData, "qq");
  const nickname = readString(formData, "nickname");
  const password = readString(formData, "password");
  const inviteCode = readString(formData, "inviteCode");
  if (!qq || !nickname || !password) redirectWithError("/register", "请填写 QQ、昵称和密码。");

  const whitelistEntry = await prisma.whitelistEntry.findUnique({ where: { qq } });
  if (!whitelistEntry) redirectWithError("/register", "这个 QQ 不在白名单中。");
  const inviteRequired = await getInviteRequiredSetting();
  if (inviteRequired && whitelistEntry.inviteCode !== inviteCode) {
    redirectWithError("/register", "邀请码不正确。");
  }

  const user = await prisma.user.create({
    data: {
      nickname,
      passwordHash: await hashPassword(password),
      qq,
    },
    select: { avatarUrl: true, id: true, nickname: true, qq: true, role: true },
  });
  await createSession(user);
  redirect("/dashboard");
}

export async function loginUser(formData: FormData) {
  const qq = readString(formData, "qq");
  const password = readString(formData, "password");
  const user = await prisma.user.findUnique({ where: { qq } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirectWithError("/login", "QQ 或密码不正确。");
  }

  await createSession(user);
  redirect("/dashboard");
}

export async function logoutUser() {
  await clearSession();
  redirect("/");
}

export async function changeOwnPasswordWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(async () => {
    const sessionUser = await requireUser();
    const currentPassword = readString(formData, "currentPassword");
    const newPassword = readString(formData, "newPassword");
    const confirmPassword = readString(formData, "confirmPassword");
    if (!currentPassword || !newPassword || !confirmPassword) throw new Error("请填写当前密码、新密码和确认密码。");
    if (newPassword.length < 6) throw new Error("新密码至少需要 6 位。");
    if (newPassword !== confirmPassword) throw new Error("两次输入的新密码不一致。");

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { passwordHash: true } });
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) throw new Error("当前密码不正确。");

    await prisma.user.update({ where: { id: sessionUser.id }, data: { passwordHash: await hashPassword(newPassword) } });
    revalidatePath("/account");
  });
}

export async function adminUpdateUserPasswordWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(async () => {
    const admin = await requireAdmin();
    const userId = readString(formData, "userId");
    const newPassword = readString(formData, "newPassword");
    if (!userId || !newPassword) throw new Error("请选择用户并填写新密码。");
    if (newPassword.length < 6) throw new Error("新密码至少需要 6 位。");

    await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
    await prisma.adminAuditLog.create({ data: { action: "user.password", actorId: admin.id, target: userId } });
    revalidatePath("/admin/users");
  });
}

export async function importWhitelist(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("CSV file is required.");
  const csv = await file.text();
  const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as Array<Record<string, string>>;

  for (const row of rows) {
    const qq = row.qq?.trim();
    if (!qq) continue;
    const inviteCode = row.inviteCode?.trim();
    await prisma.whitelistEntry.upsert({
      where: { qq },
      update: inviteCode ? { inviteCode } : {},
      create: { inviteCode: inviteCode || null, qq },
    });
  }
  revalidatePath("/admin/whitelist");
}

export async function addWhitelistEntry(formData: FormData) {
  await requireAdmin();
  const qq = readString(formData, "qq");
  const inviteCode = readString(formData, "inviteCode");
  if (!qq) throw new Error("QQ is required.");

  await prisma.whitelistEntry.upsert({
    where: { qq },
    update: inviteCode ? { inviteCode } : {},
    create: { inviteCode: inviteCode || null, qq },
  });
  revalidatePath("/admin/whitelist");
}

export async function updateInviteRequirement(formData: FormData) {
  const admin = await requireAdmin();
  const inviteRequired = readBoolean(formData, "inviteRequired");

  await setInviteRequiredSetting(inviteRequired);
  await prisma.adminAuditLog.create({
    data: {
      action: "site.inviteRequired",
      actorId: admin.id,
      detail: inviteRequired ? "enabled" : "disabled",
      target: "global",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/register");
}

export async function generateMissingInviteCodes() {
  await requireAdmin();
  const entries = await prisma.whitelistEntry.findMany({ where: { inviteCode: null }, select: { id: true } });
  for (const entry of entries) {
    await prisma.whitelistEntry.update({
      where: { id: entry.id },
      data: { inviteCode: randomBytes(4).toString("hex").toUpperCase() },
    });
  }
  revalidatePath("/admin/whitelist");
}

export async function importVtubers(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("TXT file is required.");
  const names = (await file.text())
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);

  for (const name of names) {
    await prisma.vtuberName.upsert({ where: { name }, update: { enabled: true }, create: { name } });
  }
  revalidatePath("/admin/vtubers");
}

export async function addVtuberName(formData: FormData) {
  await requireAdmin();
  const name = readString(formData, "name");
  if (!name) throw new Error("Name is required.");

  await prisma.vtuberName.upsert({ where: { name }, update: { enabled: true }, create: { name } });
  revalidatePath("/admin/vtubers");
}

export async function createAnnouncement(formData: FormData) {
  const admin = await requireAdmin();
  const title = readString(formData, "title");
  const body = readString(formData, "body");
  if (!title || !body) throw new Error("公告标题和内容不能为空。");

  await prisma.announcement.create({
    data: {
      authorId: admin.id,
      body,
      enabled: readBoolean(formData, "enabled"),
      pinned: readBoolean(formData, "pinned"),
      title,
    },
  });
  revalidateLayoutNavigation();
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
}

export async function updateAnnouncement(formData: FormData) {
  await requireAdmin();
  const announcementId = readString(formData, "announcementId");
  const title = readString(formData, "title");
  const body = readString(formData, "body");
  if (!announcementId || !title || !body) throw new Error("公告标题和内容不能为空。");

  await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      body,
      enabled: readBoolean(formData, "enabled"),
      pinned: readBoolean(formData, "pinned"),
      title,
    },
  });
  revalidateLayoutNavigation();
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
}

export async function deleteAnnouncement(formData: FormData) {
  await requireAdmin();
  const announcementId = readString(formData, "announcementId");
  if (!announcementId) throw new Error("Announcement id is required.");

  await prisma.announcement.delete({ where: { id: announcementId } });
  revalidateLayoutNavigation();
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
}

export async function createContest(formData: FormData) {
  await requireAdmin();
  const title = readString(formData, "title");
  if (!title) throw new Error("Title is required.");

  await prisma.contest.create({
    data: {
      description: readString(formData, "description") || null,
      resultsAt: readDate(formData, "resultsAt"),
      showRanksDuringVoting: readBoolean(formData, "showRanksDuringVoting"),
      showVotesDuringVoting: readBoolean(formData, "showVotesDuringVoting"),
      hideAuthorDuringVoting: readBoolean(formData, "hideAuthorDuringVoting"),
      slug: makeSlug(title),
      submissionEndAt: readDate(formData, "submissionEndAt"),
      submissionStartAt: readDate(formData, "submissionStartAt"),
      title,
      dailyVoteLimit: readPositiveInt(formData, "dailyVoteLimit", 20),
      totalVoteLimit: readPositiveInt(formData, "totalVoteLimit", 20),
      sfwDailyVoteLimit: readPositiveInt(formData, "sfwDailyVoteLimit", 20),
      nsfwDailyVoteLimit: readPositiveInt(formData, "nsfwDailyVoteLimit", 20),
      sfwTotalVoteLimit: readPositiveInt(formData, "sfwTotalVoteLimit", 20),
      nsfwTotalVoteLimit: readPositiveInt(formData, "nsfwTotalVoteLimit", 20),
      voteMode: readString(formData, "voteMode") === VoteMode.DAILY_POOL ? VoteMode.DAILY_POOL : VoteMode.SIMPLE,
      votingEndAt: readDate(formData, "votingEndAt"),
      votingStartAt: readDate(formData, "votingStartAt"),
    },
  });
  revalidateLayoutNavigation();
  revalidatePath("/admin/contests");
  revalidatePath("/");
}

export async function updateContest(formData: FormData) {
  await requireAdmin();
  const contestId = readString(formData, "contestId");
  const title = readString(formData, "title");
  if (!contestId || !title) throw new Error("Contest id and title are required.");

  await prisma.contest.update({
    where: { id: contestId },
    data: {
      description: readString(formData, "description") || null,
      resultsAt: readDate(formData, "resultsAt"),
      showRanksDuringVoting: readBoolean(formData, "showRanksDuringVoting"),
      showVotesDuringVoting: readBoolean(formData, "showVotesDuringVoting"),
      hideAuthorDuringVoting: readBoolean(formData, "hideAuthorDuringVoting"),
      submissionEndAt: readDate(formData, "submissionEndAt"),
      submissionStartAt: readDate(formData, "submissionStartAt"),
      title,
      dailyVoteLimit: readPositiveInt(formData, "dailyVoteLimit", 20),
      totalVoteLimit: readPositiveInt(formData, "totalVoteLimit", 20),
      sfwDailyVoteLimit: readPositiveInt(formData, "sfwDailyVoteLimit", 20),
      nsfwDailyVoteLimit: readPositiveInt(formData, "nsfwDailyVoteLimit", 20),
      sfwTotalVoteLimit: readPositiveInt(formData, "sfwTotalVoteLimit", 20),
      nsfwTotalVoteLimit: readPositiveInt(formData, "nsfwTotalVoteLimit", 20),
      voteMode: readString(formData, "voteMode") === VoteMode.DAILY_POOL ? VoteMode.DAILY_POOL : VoteMode.SIMPLE,
      votingEndAt: readDate(formData, "votingEndAt"),
      votingStartAt: readDate(formData, "votingStartAt"),
    },
  });
  revalidateLayoutNavigation();
  revalidatePath("/admin/contests");
  revalidatePath("/");
  revalidatePath("/vote");
  revalidatePath("/rankings");
}

export async function setContestPhase(formData: FormData) {
  await requireAdmin();
  const contestId = readString(formData, "contestId");
  const phase = readString(formData, "phase");
  const now = new Date();
  const minute = 60_000;
  const day = 24 * 60 * minute;

  const presets = {
    scheduled: {
      submissionStartAt: new Date(now.getTime() + minute),
      submissionEndAt: new Date(now.getTime() + 7 * day),
      votingStartAt: new Date(now.getTime() + 8 * day),
      votingEndAt: new Date(now.getTime() + 15 * day),
      resultsAt: new Date(now.getTime() + 16 * day),
    },
    submissions: {
      submissionStartAt: new Date(now.getTime() - minute),
      submissionEndAt: new Date(now.getTime() + 7 * day),
      votingStartAt: new Date(now.getTime() + 8 * day),
      votingEndAt: new Date(now.getTime() + 15 * day),
      resultsAt: new Date(now.getTime() + 16 * day),
    },
    voting: {
      submissionStartAt: new Date(now.getTime() - 8 * day),
      submissionEndAt: new Date(now.getTime() - minute),
      votingStartAt: new Date(now.getTime() - minute),
      votingEndAt: new Date(now.getTime() + 7 * day),
      resultsAt: new Date(now.getTime() + 8 * day),
    },
    locked: {
      submissionStartAt: new Date(now.getTime() - 16 * day),
      submissionEndAt: new Date(now.getTime() - 8 * day),
      votingStartAt: new Date(now.getTime() - 7 * day),
      votingEndAt: new Date(now.getTime() - minute),
      resultsAt: new Date(now.getTime() + day),
    },
    results: {
      submissionStartAt: new Date(now.getTime() - 16 * day),
      submissionEndAt: new Date(now.getTime() - 8 * day),
      votingStartAt: new Date(now.getTime() - 7 * day),
      votingEndAt: new Date(now.getTime() - minute),
      resultsAt: new Date(now.getTime() - minute),
    },
  } satisfies Record<string, Parameters<typeof prisma.contest.update>[0]["data"]>;

  const data = presets[phase as keyof typeof presets];
  if (!contestId || !data) throw new Error("Invalid contest phase.");

  await prisma.contest.update({ where: { id: contestId }, data });
  revalidateLayoutNavigation();
  revalidatePath("/admin/contests");
  revalidatePath("/");
  revalidatePath("/submit");
  revalidatePath("/vote");
  revalidatePath("/rankings");
}

export async function deleteContest(formData: FormData) {
  const admin = await requireAdmin();
  const contestId = readString(formData, "contestId");
  const keepFiles = readBoolean(formData, "keepFiles");
  if (!contestId) throw new Error("Contest id is required.");

  const submissions = await prisma.submission.findMany({
    where: { contestId },
    select: { storageKey: true },
  });

  if (!keepFiles) {
    await Promise.allSettled(submissions.map((submission) => deleteImageUpload(submission.storageKey)));
  }

  await prisma.contest.delete({ where: { id: contestId } });
  await prisma.adminAuditLog.create({
    data: {
      action: "contest.delete",
      actorId: admin.id,
      detail: keepFiles ? "kept files" : "deleted files",
      target: contestId,
    },
  });
  revalidateLayoutNavigation();
  revalidatePath("/admin/contests");
  revalidatePath("/");
  revalidatePath("/submit");
  revalidatePath("/vote");
  revalidatePath("/rankings");
}

async function createSubmissionFromForm(formData: FormData) {
  const user = await requireUser();
  const contestId = readString(formData, "contestId");
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest || !canSubmit(contest)) throw new Error("当前不在投稿期，暂时不能上传新作品。");

  const existingCount = await prisma.submission.count({ where: { authorId: user.id, contestId } });
  if (existingCount >= 10) throw new Error("本届投稿已达到 10 张上限。删除已有投稿后可以继续上传。");

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) throw new Error("请选择要上传的图片文件。");
  const [{ parseImageMetadata, readImageDimensions }, { saveImageUpload }] = await Promise.all([
    import("@/lib/metadata/parser"),
    import("@/lib/storage/uploads"),
  ]);
  const imageBuffer = Buffer.from(await image.arrayBuffer());
  const dimensions = readImageDimensions(imageBuffer);
  assertUploadImageIsSafe(image, imageBuffer, dimensions);
  const saved = await saveImageUpload(image, imageBuffer);
  const metadata = await parseImageMetadata(image, imageBuffer);
  const vtuberNames = [...readStringList(formData, "vtuberName"), ...readStringList(formData, "customVtuberName")];

  await prisma.submission.create({
    data: {
      authorId: user.id,
      contestId,
      description: readString(formData, "description") || null,
      imageUrl: saved.imageUrl,
      modelName: readString(formData, "modelName") || metadata.modelName || null,
      negativePrompt: readString(formData, "negativePrompt") || metadata.negativePrompt || null,
      prompt: readString(formData, "prompt") || metadata.prompt || null,
      rawMetadata: metadata.rawMetadata ?? null,
      seed: readString(formData, "seed") || metadata.seed || null,
      storageKey: saved.storageKey,
      tags: metadata.tags.join(","),
      title: readString(formData, "title"),
      toolName: readString(formData, "toolName") || metadata.toolName || null,
      track: readString(formData, "track") === "NSFW" ? Track.NSFW : Track.SFW,
      vtuberName: vtuberNames.join("、") || readString(formData, "vtuberName"),
      width: metadata.width ?? null,
      height: metadata.height ?? null,
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/submit");
}

export async function uploadSubmission(formData: FormData) {
  await createSubmissionFromForm(formData);
  redirect("/dashboard");
}

export async function uploadSubmissionWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await createSubmissionFromForm(formData);
  } catch (error) {
    return { error: toActionError(error), errorId: Date.now(), ok: false };
  }
  redirect("/dashboard");
}

export async function createComment(formData: FormData) {
  const user = await requireUser();
  const submissionId = readString(formData, "submissionId");
  const body = readString(formData, "body");
  if (!body) throw new Error("Comment body is required.");
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) throw new Error("Submission not found.");

  await prisma.comment.create({
    data: { authorId: user.id, body, contestId: submission.contestId, submissionId },
  });
  revalidatePath(`/submissions/${submissionId}`);
}

export async function castVote(formData: FormData) {
  const user = await requireUser();
  const submissionId = readString(formData, "submissionId");
  const submission = await prisma.submission.findUnique({ where: { id: submissionId }, include: { contest: true } });
  if (!submission || submission.status !== SubmissionStatus.ACTIVE) throw new Error("Submission not found.");

  const existingVote = await prisma.vote.findUnique({
    where: { contestId_submissionId_userId: { contestId: submission.contestId, submissionId, userId: user.id } },
  });
  if (existingVote) {
    await prisma.vote.delete({ where: { id: existingVote.id } });
    revalidatePath("/");
    revalidatePath("/vote");
    revalidatePath("/rankings");
    revalidatePath(`/submissions/${submissionId}`);
    return;
  }

  const { end, start } = getTodayRange();
  const usedVotes = await prisma.vote.count({
    where:
      submission.contest.voteMode === VoteMode.DAILY_POOL
        ? { contestId: submission.contestId, createdAt: { gte: start, lt: end }, userId: user.id, submission: { track: submission.track } }
        : { contestId: submission.contestId, userId: user.id, submission: { track: submission.track } },
  });
  const limit = getTrackVoteLimit(submission.contest, submission.track);
  if (usedVotes >= limit) throw new Error("剩余票数不足，取消已有投票后可以重新分配。");

  const headerStore = await headers();
  await prisma.vote.create({
    data: {
      contestId: submission.contestId,
      ipAddress: headerStore.get("x-forwarded-for") ?? null,
      submissionId,
      userAgent: headerStore.get("user-agent") ?? null,
      userId: user.id,
    },
  });
  revalidatePath("/");
  revalidatePath("/vote");
  revalidatePath(`/submissions/${submissionId}`);
  revalidatePath("/rankings");
}

export async function castVoteWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await castVote(formData);
    return { ok: true };
  } catch (error) {
    return { error: toActionError(error), errorId: Date.now(), ok: false };
  }
}

export async function setSubmissionStatus(formData: FormData) {
  const admin = await requireAdmin();
  const submissionId = readString(formData, "submissionId");
  const status = readString(formData, "status") as SubmissionStatus;
  if (![SubmissionStatus.ACTIVE, SubmissionStatus.HIDDEN, SubmissionStatus.DELETED].includes(status)) {
    throw new Error("Invalid status.");
  }

  await prisma.submission.update({ where: { id: submissionId }, data: { status } });
  await prisma.adminAuditLog.create({
    data: { action: "submission.status", actorId: admin.id, target: submissionId, detail: status },
  });
  revalidatePath("/admin/submissions");
  revalidatePath("/");
}

export async function updateOwnSubmission(formData: FormData) {
  const user = await requireUser();
  const submissionId = readString(formData, "submissionId");
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.authorId !== user.id) throw new Error("Submission not found.");
  const vtuberNames = readStringList(formData, "vtuberName");

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      description: readString(formData, "description") || null,
      modelName: readString(formData, "modelName") || null,
      negativePrompt: readString(formData, "negativePrompt") || null,
      prompt: readString(formData, "prompt") || null,
      seed: readString(formData, "seed") || null,
      title: readString(formData, "title") || submission.title,
      toolName: readString(formData, "toolName") || null,
      track: readString(formData, "track") === "NSFW" ? Track.NSFW : Track.SFW,
      vtuberName: vtuberNames.join("、") || submission.vtuberName,
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/vote");
  revalidatePath("/rankings");
}

export async function deleteOwnSubmission(formData: FormData) {
  const user = await requireUser();
  const submissionId = readString(formData, "submissionId");
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.authorId !== user.id) throw new Error("Submission not found.");

  await prisma.submission.delete({ where: { id: submissionId } });
  await deleteImageUpload(submission.storageKey);
  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/vote");
  revalidatePath("/rankings");
}

export async function importWhitelistWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(() => importWhitelist(formData));
}

export async function addWhitelistEntryWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(() => addWhitelistEntry(formData));
}

export async function updateInviteRequirementWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(() => updateInviteRequirement(formData));
}

export async function generateMissingInviteCodesWithResult(previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  void previousState;
  void formData;
  return actionResult(() => generateMissingInviteCodes());
}

export async function importVtubersWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(() => importVtubers(formData));
}

export async function addVtuberNameWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(() => addVtuberName(formData));
}

export async function createAnnouncementWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(() => createAnnouncement(formData));
}

export async function updateAnnouncementWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(() => updateAnnouncement(formData));
}

export async function deleteAnnouncementWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(() => deleteAnnouncement(formData));
}

export async function createContestWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(() => createContest(formData));
}

export async function updateContestWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(() => updateContest(formData));
}

export async function setContestPhaseWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(() => setContestPhase(formData));
}

export async function setSubmissionStatusWithResult(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return actionResult(() => setSubmissionStatus(formData));
}