import { notFound } from "next/navigation";
import { castVote, createComment } from "@/app/actions";
import { getSessionUser } from "@/lib/auth/session";
import { canViewSubmission, shouldShowVotes } from "@/lib/contest/rules";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      _count: { select: { comments: true, viewEvents: true, votes: true } },
      author: { select: { nickname: true } },
      comments: { include: { author: { select: { nickname: true } } }, orderBy: { createdAt: "desc" } },
      contest: true,
    },
  });

  if (!submission || !canViewSubmission(submission, submission.contest, user)) notFound();

  await prisma.viewEvent.create({
    data: { submissionId: submission.id, viewerId: user?.id ?? null },
  });

  const showVotes = shouldShowVotes(submission.contest);

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="panel overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={submission.imageUrl} alt={submission.title} className="mx-auto max-h-[78dvh] w-full bg-[#eadfd0] object-contain" decoding="async" fetchPriority="high" />
      </section>
      <aside className="grid content-start gap-4">
        <section className="panel grid gap-4 p-5">
          <div>
            <span className="inline-flex rounded-md bg-black/5 px-2 py-1 text-xs font-black">{submission.track}</span>
            <h1 className="mt-3 text-2xl font-black">{submission.title}</h1>
            <p className="mt-1 text-sm font-bold text-[#6d6258]">{submission.vtuberName} / {submission.author.nickname}</p>
          </div>
          <div className="grid gap-2 text-sm font-medium text-[#6d6258]">
            <span>{submission._count.viewEvents + 1} 浏览</span>
            <span>{submission._count.comments} 评论</span>
            {showVotes ? <span>{submission._count.votes} 票</span> : <span>票数暂时隐藏</span>}
          </div>
          {user ? (
            <form action={castVote}>
              <input type="hidden" name="submissionId" value={submission.id} />
              <button className="button w-full" type="submit">投票</button>
            </form>
          ) : (
            <p className="rounded-md bg-black/5 p-3 text-sm font-bold text-[#6d6258]">登录后可投票和评论。</p>
          )}
        </section>

        <section className="panel grid gap-3 p-5 text-sm">
          <h2 className="font-black">元数据</h2>
          <dl className="grid gap-2 text-[#6d6258]">
            <div><dt className="font-black text-[#17130f]">工具</dt><dd>{submission.toolName ?? "未识别"}</dd></div>
            <div><dt className="font-black text-[#17130f]">模型</dt><dd>{submission.modelName ?? "未识别"}</dd></div>
            <div><dt className="font-black text-[#17130f]">Seed</dt><dd>{submission.seed ?? "未识别"}</dd></div>
          </dl>
          {submission.prompt ? <details><summary className="cursor-pointer font-black">Prompt</summary><p className="mt-2 whitespace-pre-wrap text-[#6d6258]">{submission.prompt}</p></details> : null}
          {submission.negativePrompt ? <details><summary className="cursor-pointer font-black">Negative Prompt</summary><p className="mt-2 whitespace-pre-wrap text-[#6d6258]">{submission.negativePrompt}</p></details> : null}
        </section>

        <section className="panel grid gap-4 p-5">
          <h2 className="font-black">评论</h2>
          {user ? (
            <form action={createComment} className="grid gap-2">
              <input type="hidden" name="submissionId" value={submission.id} />
              <textarea className="input min-h-24" name="body" required />
              <button className="button secondary" type="submit">发布评论</button>
            </form>
          ) : null}
          <div className="grid gap-3">
            {submission.comments.map((comment) => (
              <article key={comment.id} className="rounded-md bg-white/70 p-3 text-sm">
                <div className="flex justify-between gap-2 font-black"><span>{comment.author.nickname}</span><span className="text-xs text-[#6d6258]">{formatDateTime(comment.createdAt)}</span></div>
                <p className="mt-2 whitespace-pre-wrap text-[#5b5047]">{comment.body}</p>
              </article>
            ))}
          </div>
        </section>
      </aside>
    </main>
  );
}