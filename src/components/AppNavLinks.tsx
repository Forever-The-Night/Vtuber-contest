"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImageUp, LogOut, Megaphone, Shield, ThumbsUp, Trophy, UserRound, X } from "lucide-react";
import { logoutUser } from "@/app/actions";

type NavUser = { nickname: string; role: "USER" | "ADMIN" } | null;
type AnnouncementNav = { id: string; title: string; body: string; pinned: boolean; updatedAt: string };

function navClass(active: boolean) {
  return `nav-link ${active ? "nav-link-active" : ""}`;
}

function DisabledNavItem({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <span className="nav-link cursor-not-allowed opacity-40" title={title} aria-disabled="true">
      {children}
    </span>
  );
}

export function AppNavLinks({
  announcements,
  canEnterSubmit,
  canEnterVote,
  user,
}: {
  announcements: AnnouncementNav[];
  canEnterSubmit: boolean;
  canEnterVote: boolean;
  user: NavUser;
}) {
  const pathname = usePathname();
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const value = window.localStorage.getItem("vtuber-contest-read-announcements");
      return value ? JSON.parse(value) as string[] : [];
    } catch {
      return [];
    }
  });
  const isRankings = pathname.startsWith("/rankings");
  const isVote = pathname.startsWith("/vote");
  const isSubmit = pathname.startsWith("/dashboard") || pathname.startsWith("/submit");
  const isAdmin = pathname.startsWith("/admin");
  const unreadCount = announcements.filter((announcement) => !readAnnouncementIds.includes(announcement.id)).length;

  function openAnnouncements() {
    setAnnouncementOpen(true);
    const nextIds = Array.from(new Set([...readAnnouncementIds, ...announcements.map((announcement) => announcement.id)]));
    setReadAnnouncementIds(nextIds);
    window.localStorage.setItem("vtuber-contest-read-announcements", JSON.stringify(nextIds));
  }

  return (
    <div className="app-nav-links flex flex-wrap items-center justify-end gap-2 text-sm font-medium">
      <Link className={navClass(isRankings)} href="/rankings" aria-current={isRankings ? "page" : undefined}>
        <Trophy size={16} /> 排名
      </Link>
      {canEnterVote ? (
        <Link className={navClass(isVote)} href="/vote" aria-current={isVote ? "page" : undefined}>
          <ThumbsUp size={16} /> 投票
        </Link>
      ) : (
        <DisabledNavItem title="当前不在投票期"><ThumbsUp size={16} /> 投票</DisabledNavItem>
      )}
      {user ? (
        <>
          {canEnterSubmit ? (
            <Link className={navClass(isSubmit)} href="/dashboard" aria-current={isSubmit ? "page" : undefined}>
              <ImageUp size={16} /> 投稿
            </Link>
          ) : (
            <DisabledNavItem title="当前不在投稿期"><ImageUp size={16} /> 投稿</DisabledNavItem>
          )}
          {user.role === "ADMIN" ? (
            <Link className={navClass(isAdmin)} href="/admin" aria-current={isAdmin ? "page" : undefined}>
              <Shield size={16} /> 后台
            </Link>
          ) : null}
          <Link className="icon-button sm:hidden" href="/account" title="账户设置"><UserRound size={16} /></Link>
          <Link className="hidden rounded-md bg-black/5 px-3 py-2 text-[#5b5047] sm:inline-flex" href="/account">{user.nickname}</Link>
          {announcements.length ? (
            <button className="icon-button relative" type="button" title="查看公告" onClick={openAnnouncements}>
              <Megaphone size={16} />
              {unreadCount ? <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#ff5b2e] px-1 text-[11px] font-black text-white">{unreadCount}</span> : null}
            </button>
          ) : null}
          <form action={logoutUser}>
            <button className="icon-button" type="submit" title="退出登录"><LogOut size={16} /></button>
          </form>
        </>
      ) : (
        <>
          <Link className={navClass(pathname.startsWith("/login"))} href="/login">
            <UserRound size={16} /> 登录
          </Link>
          <Link className="primary-link" href="/register">注册</Link>
        </>
      )}

      {announcementOpen && announcements.length ? (
        <div className="modal-backdrop announcement-modal-backdrop fixed inset-0 z-50 grid justify-items-center bg-[#17130f]/55 p-4 backdrop-blur-md" role="dialog" aria-modal="true" onMouseDown={() => setAnnouncementOpen(false)}>
          <div className="modal-surface announcement-modal-surface grid max-h-[78vh] w-full max-w-2xl gap-4 overflow-auto rounded-lg bg-[#fffaf2] p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-[#ff5b2e]">公告</p>
                <h2 className="mt-1 text-2xl font-black text-[#17130f]">比赛公告</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setAnnouncementOpen(false)} title="关闭公告"><X size={18} /></button>
            </div>
            <div className="grid gap-3">
              {announcements.map((announcement, index) => (
                <details key={announcement.id} className="rounded-lg bg-white/65 p-4" open={index === 0}>
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-black text-[#17130f]">{announcement.title}</h3>
                      <span className="text-xs font-black text-[#6d6258]">{announcement.pinned ? "置顶 / " : ""}{announcement.updatedAt}</span>
                    </div>
                  </summary>
                  <p className="mt-3 whitespace-pre-wrap font-medium leading-8 text-[#5b5047]">{announcement.body}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}