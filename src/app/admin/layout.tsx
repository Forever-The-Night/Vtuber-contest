import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";

const links = [
  ["/admin", "总览"],
  ["/admin/users", "用户"],
  ["/admin/contests", "届次"],
  ["/admin/announcements", "公告"],
  ["/admin/group", "加群"],
  ["/admin/whitelist", "QQ 白名单"],
  ["/admin/vtubers", "VTuber 名单"],
  ["/admin/submissions", "作品"],
  ["/admin/votes", "投票日志"],
];

export const metadata: Metadata = {
  title: {
    default: "管理后台",
    template: "%s - 维AI信",
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <main className="page-shell grid gap-6">
      <div>
        <h1 className="text-3xl font-black">管理后台</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map(([href, label]) => (
            <Link key={href} className="nav-link bg-white/60" href={href} prefetch={false}>{label}</Link>
          ))}
        </div>
      </div>
      {children}
    </main>
  );
}