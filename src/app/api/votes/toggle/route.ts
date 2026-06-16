import { SubmissionStatus, VoteMode } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { end, start };
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再投票。" }, { status: 401 });
  }

  try {
    const body = await request.json() as { submissionId?: unknown };
    const submissionId = typeof body.submissionId === "string" ? body.submissionId : "";
    if (!submissionId) {
      return NextResponse.json({ error: "作品不存在。" }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      include: { contest: true },
      where: { id: submissionId },
    });
    if (!submission || submission.status !== SubmissionStatus.ACTIVE) {
      return NextResponse.json({ error: "作品不存在。" }, { status: 404 });
    }

    const existingVote = await prisma.vote.findUnique({
      where: { contestId_submissionId_userId: { contestId: submission.contestId, submissionId, userId: user.id } },
    });

    if (existingVote) {
      await prisma.vote.delete({ where: { id: existingVote.id } });
      revalidatePath("/rankings");
      revalidatePath(`/submissions/${submissionId}`);
      return NextResponse.json({ hasVoted: false });
    }

    const { end, start } = getTodayRange();
    const usedVotes = await prisma.vote.count({
      where:
        submission.contest.voteMode === VoteMode.DAILY_POOL
          ? { contestId: submission.contestId, createdAt: { gte: start, lt: end }, userId: user.id }
          : { contestId: submission.contestId, userId: user.id },
    });
    const limit = submission.contest.voteMode === VoteMode.DAILY_POOL ? submission.contest.dailyVoteLimit : submission.contest.totalVoteLimit;
    if (usedVotes >= limit) {
      return NextResponse.json({ error: "剩余票数不足，取消已有投票后可以重新分配。" }, { status: 409 });
    }

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

    revalidatePath("/rankings");
    revalidatePath(`/submissions/${submissionId}`);
    return NextResponse.json({ hasVoted: true });
  } catch {
    return NextResponse.json({ error: "投票没有完成，请稍后重试。" }, { status: 500 });
  }
}
