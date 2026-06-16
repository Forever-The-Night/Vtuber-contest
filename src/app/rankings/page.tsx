import { Track } from "@prisma/client";
import { EmptyState } from "@/components/EmptyState";
import { RankingsBoardClient } from "@/components/RankingsBoardClient";
import { shouldShowRanks, shouldShowVotes } from "@/lib/contest/rules";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RankingsPage() {
  const contest = await prisma.contest.findFirst({ orderBy: { submissionStartAt: "desc" } });
  if (!contest) {
    return <main className="page-shell"><EmptyState title="还没有排行榜">管理员创建比赛后，这里会显示结果。</EmptyState></main>;
  }

  const canShow = shouldShowRanks(contest) || shouldShowVotes(contest);
  const submissions = await prisma.submission.findMany({
    where: { contestId: contest.id, status: "ACTIVE" },
    include: { _count: { select: { votes: true } }, author: { select: { nickname: true } } },
  });
  const ranked = submissions
    .sort((a, b) => b._count.votes - a._count.votes)
    .map((submission) => ({
      authorName: submission.author.nickname,
      id: submission.id,
      imageUrl: submission.imageUrl,
      title: submission.title,
      track: submission.track === Track.NSFW ? Track.NSFW : Track.SFW,
      votes: submission._count.votes,
      vtuberName: submission.vtuberName,
    }));

  return (
    <main className="page-shell grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">排行榜</h1>
          <p className="mt-2 font-medium text-[#6d6258]">{contest.title}</p>
        </div>
      </div>
      {!canShow ? (
        <EmptyState title="当前封榜中">管理员默认隐藏投票期票数和排名，结果公布后会展示。</EmptyState>
      ) : (
        <RankingsBoardClient submissions={ranked} />
      )}
    </main>
  );
}