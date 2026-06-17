"use client";

import { useEffect, useState } from "react";

type TrackName = "SFW" | "NSFW";
type VoteModeName = "SIMPLE" | "DAILY_POOL" | "ARENA";
type Quota = Record<TrackName, number>;

export function emitVoteQuotaChange(track: TrackName, delta: number) {
  window.dispatchEvent(new CustomEvent<{ delta: number; track: TrackName }>("vote-quota-change", {
    detail: { delta, track },
  }));
}

export function VoteQuotaPanel({
  initialUsage,
  limit,
  selectedTrack,
  voteMode,
}: {
  initialUsage: Quota;
  limit: Quota;
  selectedTrack: TrackName;
  voteMode: VoteModeName;
}) {
  const [usage, setUsage] = useState(initialUsage);

  useEffect(() => {
    function onVoteQuotaChange(event: Event) {
      const detail = (event as CustomEvent<{ delta?: unknown; track?: unknown }>).detail;
      const track = detail?.track === "NSFW" ? "NSFW" : detail?.track === "SFW" ? "SFW" : null;
      const delta = typeof detail?.delta === "number" ? detail.delta : 0;
      if (!track || !delta) return;

      setUsage((current) => ({
        ...current,
        [track]: Math.max(0, Math.min(limit[track], current[track] + delta)),
      }));
    }

    window.addEventListener("vote-quota-change", onVoteQuotaChange);
    return () => window.removeEventListener("vote-quota-change", onVoteQuotaChange);
  }, [limit]);

  const remaining = {
    SFW: Math.max(0, limit.SFW - usage.SFW),
    NSFW: Math.max(0, limit.NSFW - usage.NSFW),
  } satisfies Quota;

  return (
    <aside className="vote-quota-panel rounded-lg border border-black/10 bg-[#fffaf2]/95 p-4 shadow-2xl backdrop-blur-md">
      <p className="text-xs font-black text-[#6d6258]">{voteMode === "DAILY_POOL" ? "今日剩余票数（分赛道）" : "本届剩余票数（分赛道）"}</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className={`rounded-md px-3 py-2 ${selectedTrack === "SFW" ? "bg-[#e4fbf4]" : "bg-white/70"}`}>
          <p className="text-xs font-black text-[#006b64]">SFW</p>
          <p className="text-2xl font-black text-[#006b64]">{remaining.SFW}</p>
          <p className="text-xs font-bold text-[#5b5047]">已用 {usage.SFW} / {limit.SFW}</p>
        </div>
        <div className={`rounded-md px-3 py-2 ${selectedTrack === "NSFW" ? "bg-[#ffe8e2]" : "bg-white/70"}`}>
          <p className="text-xs font-black text-[#b23a24]">NSFW</p>
          <p className="text-2xl font-black text-[#b23a24]">{remaining.NSFW}</p>
          <p className="text-xs font-bold text-[#5b5047]">已用 {usage.NSFW} / {limit.NSFW}</p>
        </div>
      </div>
    </aside>
  );
}
