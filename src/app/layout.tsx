import type { Metadata } from "next";
import { Noto_Sans_SC, ZCOOL_QingKe_HuangYou } from "next/font/google";
import Link from "next/link";
import { Crown } from "lucide-react";
import "./globals.css";
import { AppNavLinks } from "@/components/AppNavLinks";
import { getSessionUser } from "@/lib/auth/session";
import { getContestPhase } from "@/lib/contest/rules";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

const notoSans = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const displayFont = ZCOOL_QingKe_HuangYou({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "VTuber AI Image Contest",
  description: "A private VTuber themed AI image contest platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, contest, announcements] = await Promise.all([
    getSessionUser(),
    prisma.contest.findFirst({ orderBy: { submissionStartAt: "desc" } }),
    prisma.announcement.findMany({ where: { enabled: true }, orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }], take: 10 }),
  ]);
  const phase = contest ? getContestPhase(contest) : null;
  const canEnterSubmit = phase === "submissions" || phase === "voting";
  const canEnterVote = phase === "voting";

  return (
    <html lang="zh-CN" className={`${notoSans.variable} ${displayFont.variable} h-full antialiased`}>
      <body className="min-h-full">
        <header className="sticky top-0 z-40 border-b border-black/10 bg-[#fffaf2]/90 backdrop-blur-xl">
          <nav className="app-shell-nav mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-black text-[#17130f]">
              <span className="grid size-9 place-items-center rounded-md bg-[#ff5b2e] text-white">
                <Crown size={20} />
              </span>
              <span className="font-display text-2xl tracking-normal">啬图大赛</span>
            </Link>
            <AppNavLinks
              announcements={announcements.map((announcement) => ({
                body: announcement.body,
                id: announcement.id,
                pinned: announcement.pinned,
                title: announcement.title,
                updatedAt: formatDateTime(announcement.updatedAt),
              }))}
              canEnterSubmit={canEnterSubmit}
              canEnterVote={canEnterVote}
              user={user ? { nickname: user.nickname, role: user.role } : null}
            />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}