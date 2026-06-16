import type { Metadata } from "next";
import { Noto_Sans_SC, ZCOOL_QingKe_HuangYou } from "next/font/google";
import Link from "next/link";
import { Crown } from "lucide-react";
import "./globals.css";
import { AppNavLinks } from "@/components/AppNavLinks";
import { getSessionUser } from "@/lib/auth/session";
import { getLayoutNavigationData } from "@/lib/layout-navigation";

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

export const preferredRegion = "sin1";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, navigation] = await Promise.all([
    getSessionUser(),
    getLayoutNavigationData(),
  ]);

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
              announcements={navigation.announcements}
              canEnterSubmit={navigation.canEnterSubmit}
              canEnterVote={navigation.canEnterVote}
              user={user ? { nickname: user.nickname, role: user.role } : null}
            />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}