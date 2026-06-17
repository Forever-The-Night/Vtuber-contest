import type { Metadata } from "next";
import Link from "next/link";
import { Track, VoteMode } from "@prisma/client";
import { redirect } from "next/navigation";
import { SubmissionGrid } from "@/components/SubmissionGrid";
import { getSessionUser } from "@/lib/auth/session";
import { canViewSubmission, getContestPhase } from "@/lib/contest/rules";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "投票",
};

function splitVtuberNames(value: string) {
  return value.split(/[、，,]/).map((name) => name.trim()).filter(Boolean);
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { end, start };
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

type VoteSearchParams = { sort?: string; voted?: string; vtuber?: string };

export default async function VotePage({ searchParams }: { searchParams?: Promise<VoteSearchParams> }) {
  const query = await searchParams;
  const selectedVtuber = query?.vtuber?.trim() ?? "";
  const voteView = query?.voted === "yes" || query?.voted === "no" ? query.voted : "all";
  const sortMode = query?.sort === "random" || query?.sort === "popular" ? query.sort : "latest";
  const [user, contest] = await Promise.all([
    getSessionUser(),
    prisma.contest.findFirst({ orderBy: { submissionStartAt: "desc" } }),
  ]);

  if (!contest) {
    redirect("/dashboard");
  }

  const phase = getContestPhase(contest);
  if (phase !== "voting") redirect("/dashboard");

  const submissions = await prisma.submission.findMany({
    where: { contestId: contest.id, status: "ACTIVE", ...(user ? {} : { track: Track.SFW }) },
    include: { _count: { select: { comments: true, viewEvents: true, votes: true } }, author: { select: { nickname: true } } },
    orderBy: { createdAt: "desc" },
  });
  const votedSubmissionIds = user
    ? new Set(
        (await prisma.vote.findMany({
          where: { contestId: contest.id, userId: user.id },
          select: { submissionId: true },
        })).map((vote) => vote.submissionId),
      )
    : new Set<string>();
  const todayRange = getTodayRange();
  const voteUsage = user
    ? await prisma.vote.count({
        where:
          contest.voteMode === VoteMode.DAILY_POOL
            ? { contestId: contest.id, createdAt: { gte: todayRange.start, lt: todayRange.end }, userId: user.id }
            : { contestId: contest.id, userId: user.id },
      })
    : 0;
  const voteLimit = contest.voteMode === VoteMode.DAILY_POOL ? contest.dailyVoteLimit : contest.totalVoteLimit;
  const remainingVotes = Math.max(0, voteLimit - voteUsage);
  const canVote = Boolean(user && phase === "voting");
  const visibleSubmissions = submissions.filter((submission) => canViewSubmission(submission, contest, user));
  const vtuberOptions = Array.from(new Set(visibleSubmissions.flatMap((submission) => splitVtuberNames(submission.vtuberName)))).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  const filteredByVtuber = selectedVtuber
    ? visibleSubmissions.filter((submission) => splitVtuberNames(submission.vtuberName).includes(selectedVtuber))
    : visibleSubmissions;
  const filteredByVote = user && voteView === "yes"
    ? filteredByVtuber.filter((submission) => votedSubmissionIds.has(submission.id))
    : user && voteView === "no"
      ? filteredByVtuber.filter((submission) => !votedSubmissionIds.has(submission.id))
      : filteredByVtuber;
  const filteredSubmissions = [...filteredByVote].sort((a, b) => {
    if (sortMode === "random") {
      const salt = todayRange.start.toISOString();
      return stableHash(`${a.id}:${salt}`) - stableHash(`${b.id}:${salt}`);
    }
    if (sortMode === "popular") return b._count.votes - a._count.votes;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  function voteHref(next: Partial<VoteSearchParams>) {
    const params = new URLSearchParams();
    const nextVtuber = next.vtuber ?? selectedVtuber;
    const nextVoted = next.voted ?? voteView;
    const nextSort = next.sort ?? sortMode;
    if (nextVtuber) params.set("vtuber", nextVtuber);
    if (nextVoted && nextVoted !== "all") params.set("voted", nextVoted);
    if (nextSort && nextSort !== "latest") params.set("sort", nextSort);
    const value = params.toString();
    return value ? `/vote?${value}` : "/vote";
  }

  return (
    <main className="page-shell grid gap-6">
      <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h1 className="text-3xl font-black">投票页面</h1>
          <p className="mt-2 font-medium text-[#6d6258]">点图片看浮层详情，投票按钮直接在瀑布流卡片上。{user ? "" : " 登录后可进入 NSFW 并投票。"}</p>
        </div>
        <span className="rounded-md bg-black/5 px-3 py-2 text-sm font-black text-[#5b5047]">{contest.title}</span>
      </section>
      {user && phase === "voting" ? (
        <aside className="vote-quota-panel rounded-lg border border-black/10 bg-[#fffaf2]/95 p-4 shadow-2xl backdrop-blur-md">
          <p className="text-xs font-black text-[#6d6258]">{contest.voteMode === VoteMode.DAILY_POOL ? "今日剩余票数" : "本届剩余票数"}</p>
          <p className="mt-1 text-4xl font-black text-[#ff5b2e]">{remainingVotes}</p>
          <p className="mt-1 text-xs font-bold text-[#6d6258]">已用 {voteUsage} / {voteLimit}</p>
        </aside>
      ) : null}
      <section className="panel grid gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            ["latest", "最新"],
            ["random", "随机"],
            ["popular", "热度"],
          ].map(([value, label]) => (
            <Link key={value} className={`interactive-chip rounded-md px-3 py-2 text-sm font-black ${sortMode === value ? "is-active bg-[#17130f] text-white" : "bg-black/5 text-[#5b5047]"}`} href={voteHref({ sort: value })}>{label}</Link>
          ))}
          {user ? (
            <>
              <Link className={`interactive-chip rounded-md px-3 py-2 text-sm font-black ${voteView === "all" ? "is-active bg-[#ff5b2e] text-white" : "bg-black/5 text-[#5b5047]"}`} href={voteHref({ voted: "all" })}>全部作品</Link>
              <Link className={`interactive-chip rounded-md px-3 py-2 text-sm font-black ${voteView === "yes" ? "is-active bg-[#ff5b2e] text-white" : "bg-black/5 text-[#5b5047]"}`} href={voteHref({ voted: "yes" })}>已投作品</Link>
              <Link className={`interactive-chip rounded-md px-3 py-2 text-sm font-black ${voteView === "no" ? "is-active bg-[#ff5b2e] text-white" : "bg-black/5 text-[#5b5047]"}`} href={voteHref({ voted: "no" })}>只看未投</Link>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className={`interactive-chip rounded-md px-3 py-2 text-sm font-black ${selectedVtuber ? "bg-black/5 text-[#5b5047]" : "is-active bg-[#ff5b2e] text-white"}`} href={voteHref({ vtuber: "" })}>全部 VTuber</Link>
          {vtuberOptions.map((name) => (
            <Link
              key={name}
              className={`interactive-chip rounded-md px-3 py-2 text-sm font-black ${selectedVtuber === name ? "is-active bg-[#ff5b2e] text-white" : "bg-black/5 text-[#5b5047]"}`}
              href={voteHref({ vtuber: name })}
            >
              {name}
            </Link>
          ))}
        </div>
      </section>
      <SubmissionGrid
        items={filteredSubmissions.map((submission) => ({
          authorName: submission.author.nickname,
          canVote: canVote && (remainingVotes > 0 || votedSubmissionIds.has(submission.id)),
          comments: submission._count.comments,
          description: submission.description,
          hasVoted: votedSubmissionIds.has(submission.id),
          id: submission.id,
          imageUrl: submission.imageUrl,
          modelName: submission.modelName,
          negativePrompt: submission.negativePrompt,
          prompt: submission.prompt,
          seed: submission.seed,
          showVotes: true,
          title: submission.title,
          toolName: submission.toolName,
          track: submission.track,
          views: submission._count.viewEvents,
          votes: submission._count.votes,
          vtuberName: submission.vtuberName,
        }))}
      />
    </main>
  );
}