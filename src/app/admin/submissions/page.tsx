import type { Metadata } from "next";
import { SubmissionStatus } from "@prisma/client";
import { setSubmissionStatusWithResult } from "@/app/actions";
import { ActionResultForm } from "@/components/ActionResultForm";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "作品管理",
};

export default async function AdminSubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    include: { _count: { select: { comments: true, votes: true, viewEvents: true } }, author: { select: { nickname: true, qq: true } }, contest: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <section className="grid gap-4">
      {submissions.map((submission) => (
        <article key={submission.id} className="panel grid gap-4 p-4 sm:grid-cols-[120px_1fr] lg:grid-cols-[140px_1fr_auto]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={submission.imageUrl} alt={submission.title} className="aspect-square max-h-72 w-full rounded-md object-cover sm:max-h-none" loading="lazy" decoding="async" />
          <div>
            <h2 className="text-lg font-black">{submission.title}</h2>
            <p className="text-sm font-bold text-[#6d6258]">{submission.contest.title} / {submission.track} / {submission.vtuberName}</p>
            <p className="mt-1 text-sm text-[#6d6258]">作者：{submission.author.nickname} ({submission.author.qq}) / {formatDateTime(submission.createdAt)}</p>
            <p className="mt-2 text-sm font-bold text-[#6d6258]">{submission._count.votes} 票 · {submission._count.viewEvents} 浏览 · {submission._count.comments} 评论 · {submission.status}</p>
          </div>
          <ActionResultForm action={setSubmissionStatusWithResult} className="grid content-start gap-2" successMessage="状态已更新。">
            <input type="hidden" name="submissionId" value={submission.id} />
            <select className="input" name="status" defaultValue={submission.status}>
              {Object.values(SubmissionStatus).map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button className="button secondary" type="submit">更新状态</button>
          </ActionResultForm>
        </article>
      ))}
    </section>
  );
}