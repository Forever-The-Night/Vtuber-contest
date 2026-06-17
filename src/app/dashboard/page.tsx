import type { Metadata } from "next";
import { MySubmissionManager } from "@/components/MySubmissionManager";
import { SubmissionUploadForm } from "@/components/SubmissionUploadForm";
import { requireUser } from "@/lib/auth/session";
import { canSubmit } from "@/lib/contest/rules";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "我的投稿",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const [contest, submissions, vtubers] = await Promise.all([
    prisma.contest.findFirst({ orderBy: { submissionStartAt: "desc" } }),
    prisma.submission.findMany({
      where: { authorId: user.id },
      include: { _count: { select: { comments: true, viewEvents: true, votes: true } }, author: { select: { nickname: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vtuberName.findMany({ where: { enabled: true }, orderBy: { name: "asc" }, take: 400 }),
  ]);

  const currentCount = contest ? submissions.filter((submission) => submission.contestId === contest.id).length : 0;

  return (
    <main className="page-shell grid gap-8">
      <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h1 className="text-3xl font-black">个人中心</h1>
          <p className="mt-2 font-medium text-[#6d6258]">{contest ? `当前届次已投稿 ${currentCount}/10 张。` : "管理员创建届次后即可投稿。"}</p>
        </div>
      </section>

      {contest && canSubmit(contest) && currentCount < 10 ? (
        <SubmissionUploadForm
          contestId={contest.id}
          contestTitle={contest.title}
          currentCount={currentCount}
          vtuberNames={vtubers.map((vtuber) => vtuber.name)}
        />
      ) : (
        <div className="panel grid min-h-36 place-items-center p-6 text-center font-bold text-[#6d6258]">
          {contest && currentCount >= 10 ? "当前届次投稿已达上限。删除已有投稿后，这里会重新显示上传区。" : contest ? "当前不在投稿期，投稿区暂不可用。" : "管理员创建届次后，这里会显示拖放投稿区。"}
        </div>
      )}

      <section className="grid gap-4">
        <h2 className="text-2xl font-black">我的作品</h2>
        <MySubmissionManager
          vtuberNames={vtubers.map((vtuber) => vtuber.name)}
          submissions={submissions.map((submission) => ({
            description: submission.description,
            id: submission.id,
            imageUrl: submission.imageUrl,
            modelName: submission.modelName,
            negativePrompt: submission.negativePrompt,
            prompt: submission.prompt,
            seed: submission.seed,
            title: submission.title,
            toolName: submission.toolName,
            track: submission.track,
            votes: submission._count.votes,
            vtuberName: submission.vtuberName,
          }))}
        />
      </section>
    </main>
  );
}