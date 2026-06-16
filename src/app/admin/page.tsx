import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", { day: "2-digit", month: "2-digit" }).format(date);
}

function splitVtuberNames(value: string) {
  return value.split(/[、，,]/).map((name) => name.trim()).filter(Boolean);
}

export default async function AdminPage() {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const since = days[0];
  const [users, whitelist, contests, announcements, submissions, votes, statusGroups, trackGroups, recentSubmissions, recentVotes, activeSubmissions, audits] = await Promise.all([
    prisma.user.count(),
    prisma.whitelistEntry.count(),
    prisma.contest.count(),
    prisma.announcement.count(),
    prisma.submission.count(),
    prisma.vote.count(),
    prisma.submission.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.submission.groupBy({ by: ["track"], _count: { _all: true } }),
    prisma.submission.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.vote.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.submission.findMany({ select: { vtuberName: true } }),
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const submissionTrend = days.map((date) => {
    const label = dayLabel(date);
    return { label, value: recentSubmissions.filter((submission) => dayLabel(submission.createdAt) === label).length };
  });
  const voteTrend = days.map((date) => {
    const label = dayLabel(date);
    return { label, value: recentVotes.filter((vote) => dayLabel(vote.createdAt) === label).length };
  });
  const maxTrendValue = Math.max(1, ...submissionTrend.map((item) => item.value), ...voteTrend.map((item) => item.value));
  const vtuberCounts = new Map<string, number>();
  for (const submission of activeSubmissions) {
    for (const name of splitVtuberNames(submission.vtuberName)) {
      vtuberCounts.set(name, (vtuberCounts.get(name) ?? 0) + 1);
    }
  }
  const topVtubers = Array.from(vtuberCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["用户", users],
          ["白名单", whitelist],
          ["届次", contests],
          ["公告", announcements],
          ["作品", submissions],
          ["投票", votes],
        ].map(([label, value]) => (
          <div key={label} className="panel p-5">
            <p className="text-sm font-black text-[#6d6258]">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <section className="panel flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-xl font-black">运营导出</h2>
          <p className="mt-1 text-sm font-bold text-[#6d6258]">用于封榜、复盘和人工核查。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="button secondary" href="/admin/submissions/export">导出作品</Link>
          <Link className="button secondary" href="/admin/votes/export">导出投票</Link>
          <Link className="button secondary" href="/admin/rankings/export">导出排行榜</Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel grid gap-5 p-5">
          <h2 className="text-xl font-black">近 7 日趋势</h2>
          <div className="grid gap-4">
            {days.map((date, index) => (
              <div key={date.toISOString()} className="grid gap-2">
                <div className="flex items-center justify-between text-sm font-black text-[#6d6258]"><span>{dayLabel(date)}</span><span>投稿 {submissionTrend[index].value} / 投票 {voteTrend[index].value}</span></div>
                <div className="grid gap-1">
                  <div className="h-2 rounded-full bg-black/5"><div className="h-full rounded-full bg-[#00a6a6]" style={{ width: `${Math.max(4, submissionTrend[index].value / maxTrendValue * 100)}%` }} /></div>
                  <div className="h-2 rounded-full bg-black/5"><div className="h-full rounded-full bg-[#ff5b2e]" style={{ width: `${Math.max(4, voteTrend[index].value / maxTrendValue * 100)}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel grid content-start gap-5 p-5">
          <h2 className="text-xl font-black">分布概览</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-white/65 p-4">
              <h3 className="font-black">作品状态</h3>
              <div className="mt-3 grid gap-2 text-sm font-bold text-[#6d6258]">
                {statusGroups.map((group) => <span key={group.status}>{group.status}：{group._count._all}</span>)}
              </div>
            </div>
            <div className="rounded-lg bg-white/65 p-4">
              <h3 className="font-black">赛道</h3>
              <div className="mt-3 grid gap-2 text-sm font-bold text-[#6d6258]">
                {trackGroups.map((group) => <span key={group.track}>{group.track}：{group._count._all}</span>)}
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white/65 p-4">
            <h3 className="font-black">热门 VTuber</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {topVtubers.length ? topVtubers.map(([name, count]) => <span key={name} className="rounded-md bg-[#e4fbf4] px-3 py-2 text-sm font-black text-[#006b64]">{name} · {count}</span>) : <span className="text-sm font-bold text-[#6d6258]">暂无数据</span>}
            </div>
          </div>
        </section>
      </div>

      <section className="panel grid gap-3 p-5">
        <h2 className="text-xl font-black">最近管理操作</h2>
        {audits.length ? audits.map((audit) => (
          <div key={audit.id} className="grid gap-1 rounded-lg bg-white/65 p-3 text-sm">
            <b>{audit.action}</b>
            <span className="break-all text-[#6d6258]">{audit.target} {audit.detail ? `/ ${audit.detail}` : ""} / {formatDateTime(audit.createdAt)}</span>
          </div>
        )) : <p className="text-sm font-bold text-[#6d6258]">暂无操作日志。</p>}
      </section>
    </section>
  );
}