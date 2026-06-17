import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "投票日志",
};

export default async function AdminVotesPage() {
  const votes = await prisma.vote.findMany({
    include: { submission: { select: { title: true, track: true } }, user: { select: { nickname: true, qq: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return (
    <section className="grid gap-4">
      <div className="grid gap-3 md:hidden">
        {votes.map((vote) => (
          <article key={vote.id} className="panel grid gap-2 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b>{vote.user.nickname} ({vote.user.qq})</b>
              <span className="rounded-md bg-black/5 px-2 py-1 text-xs font-black">{vote.submission.track}</span>
            </div>
            <p className="font-bold text-[#17130f]">{vote.submission.title}</p>
            <p className="text-[#6d6258]">{formatDateTime(vote.createdAt)}</p>
            <p className="break-all text-[#6d6258]">IP：{vote.ipAddress ?? "-"}</p>
            <p className="line-clamp-2 break-all text-[#6d6258]">UA：{vote.userAgent ?? "-"}</p>
          </article>
        ))}
      </div>
      <div className="panel hidden overflow-x-auto md:block">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-black/5"><tr><th className="p-3">时间</th><th className="p-3">用户</th><th className="p-3">作品</th><th className="p-3">赛道</th><th className="p-3">IP</th><th className="p-3">UA</th></tr></thead>
        <tbody>
          {votes.map((vote) => (
            <tr key={vote.id} className="border-t border-black/10 align-top">
              <td className="p-3">{formatDateTime(vote.createdAt)}</td>
              <td className="p-3 font-bold">{vote.user.nickname} ({vote.user.qq})</td>
              <td className="p-3">{vote.submission.title}</td>
              <td className="p-3">{vote.submission.track}</td>
              <td className="p-3">{vote.ipAddress ?? "-"}</td>
              <td className="p-3 max-w-sm truncate">{vote.userAgent ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}