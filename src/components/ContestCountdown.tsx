"use client";

import { useEffect, useState } from "react";

function formatDistance(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function ContestCountdown({ label, targetAt }: { label: string; targetAt: string }) {
  const [remaining, setRemaining] = useState(() => new Date(targetAt).getTime() - Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(new Date(targetAt).getTime() - Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetAt]);

  const distance = formatDistance(remaining);
  const items = [
    ["天", distance.days],
    ["时", distance.hours],
    ["分", distance.minutes],
    ["秒", distance.seconds],
  ];

  return (
    <div className="grid gap-3">
      <p className="text-sm font-black text-[#6d6258]">{remaining <= 0 ? "阶段时间已到，请刷新页面" : label}</p>
      <div className="grid grid-cols-4 gap-2">
        {items.map(([unit, value]) => (
          <span key={unit} className="rounded-lg border border-black/10 bg-white/70 p-3 text-center shadow-sm">
            <b className="block text-3xl font-black text-[#ff5b2e]">{String(value).padStart(2, "0")}</b>
            <small className="text-xs font-black text-[#6d6258]">{unit}</small>
          </span>
        ))}
      </div>
    </div>
  );
}