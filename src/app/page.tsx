import { Track } from "@prisma/client";
import { EmptyState } from "@/components/EmptyState";
import { HomeHeroExperience } from "@/components/HomeHeroExperience";
import { getSessionUser } from "@/lib/auth/session";
import { getContestPhase, shouldShowVotes } from "@/lib/contest/rules";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const phaseLabels = {
  scheduled: "未开始",
  submissions: "投稿期",
  between: "等待投票",
  voting: "投票期",
  locked: "封榜整理",
  results: "结果公布",
};

function phaseCopy(phase: ReturnType<typeof getContestPhase> | null) {
  switch (phase) {
    case "scheduled": return { cta: "进入投稿页", href: "/dashboard", label: "距离投稿开始", text: "比赛即将开始，先准备好源文件和作品信息。" };
    case "submissions": return { cta: "进入投稿页", href: "/dashboard", label: "距离投稿结束", text: "投稿开放中，可以上传、预览和编辑自己的作品。" };
    case "between": return { cta: "查看我的投稿", href: "/dashboard", label: "距离投票开始", text: "投稿已结束，作品池正在等待投票开启。" };
    case "voting": return { cta: "进入投票页", href: "/vote", label: "距离投票结束", text: "投票正在进行，浏览作品并把票投给喜欢的图。" };
    case "locked": return { cta: "查看投稿", href: "/dashboard", label: "距离结果公布", text: "投票已结束，结果正在封榜整理。" };
    case "results": return { cta: "查看排名", href: "/rankings", label: "结果已公布", text: "本届结果已经公布，可以查看排行榜。" };
    default: return { cta: "创建首位管理员", href: "/setup", label: "等待比赛创建", text: "管理员创建届次后，首页会展示当前比赛。" };
  }
}

function nextTarget(contest: NonNullable<Awaited<ReturnType<typeof prisma.contest.findFirst>>>, phase: ReturnType<typeof getContestPhase>) {
  switch (phase) {
    case "scheduled": return contest.submissionStartAt;
    case "submissions": return contest.submissionEndAt;
    case "between": return contest.votingStartAt;
    case "voting": return contest.votingEndAt;
    case "locked": return contest.resultsAt;
    default: return undefined;
  }
}

export default async function Home() {
  const [user, userCount, contest, announcement] = await Promise.all([
    getSessionUser(),
    prisma.user.count(),
    prisma.contest.findFirst({ orderBy: { submissionStartAt: "desc" } }),
    prisma.announcement.findFirst({ where: { enabled: true }, orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }] }),
  ]);

  if (!contest) {
    return (
      <main className="page-shell grid gap-6">
        <HomeHeroExperience
          announcement={announcement ? { body: announcement.body, title: announcement.title } : null}
          countdownLabel="等待比赛创建"
          images={[]}
          phaseLabel="等待比赛"
          primaryHref={user ? "/admin/contests" : "/login"}
          primaryLabel={user ? "创建比赛" : "登录后参与"}
          showSetupLink={userCount === 0}
          subtitle="管理员创建届次后，首页会展示当前比赛、阶段倒计时和 SFW 热门作品。"
          title="啬图大赛"
        />
        <EmptyState title="还没有比赛届次">创建首位管理员后，在后台添加第一届比赛。</EmptyState>
      </main>
    );
  }

  const phase = getContestPhase(contest);
  const copy = phaseCopy(phase);
  const showVotes = shouldShowVotes(contest);
  const target = nextTarget(contest, phase);
  const submissions = await prisma.submission.findMany({
    where: { contestId: contest.id, status: "ACTIVE", track: Track.SFW },
    include: { _count: { select: { viewEvents: true, votes: true } }, author: { select: { nickname: true } } },
    orderBy: showVotes ? [{ votes: { _count: "desc" } }, { createdAt: "desc" }] : [{ viewEvents: { _count: "desc" } }, { createdAt: "desc" }],
    take: 8,
  });

  return (
    <main className="home-page-shell">
      <HomeHeroExperience
        announcement={announcement ? { body: announcement.body, title: announcement.title } : null}
        countdownLabel={copy.label}
        images={submissions.map((submission) => ({
          authorName: submission.author.nickname,
          id: submission.id,
          imageUrl: submission.imageUrl,
          metricLabel: showVotes ? "票数" : "浏览",
          metricValue: showVotes ? submission._count.votes : submission._count.viewEvents,
          title: submission.title,
          vtuberName: submission.vtuberName,
        }))}
        phaseLabel={phaseLabels[phase]}
        primaryHref={user ? copy.href : "/login"}
        primaryLabel={user ? copy.cta : "登录后参与"}
        showSetupLink={userCount === 0}
        subtitle={copy.text}
        targetAt={target?.toISOString()}
        title={contest.title}
      />
    </main>
  );
}
