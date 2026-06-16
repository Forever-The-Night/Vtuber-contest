"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RankingImagePreview } from "@/components/RankingImagePreview";

type HeroImage = {
  id: string;
  imageUrl: string;
  title: string;
  vtuberName: string;
  authorName: string;
  metricLabel: string;
  metricValue: number;
};

export function HeroImageCarousel({ items }: { items: HeroImage[] }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  useEffect(() => {
    if (items.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % items.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!current) {
    return <div className="panel grid min-h-[360px] place-items-center p-6 text-center font-bold text-[#6d6258]">热门图片会在作品出现后展示。</div>;
  }

  function go(offset: number) {
    setActive((index) => (index + offset + items.length) % items.length);
  }

  return (
    <section className="panel overflow-hidden">
      <div className="relative min-h-[360px] bg-[#201a16]">
        <RankingImagePreview
          buttonClassName="block h-[360px] w-full"
          imageClassName="h-[360px] w-full object-cover object-top"
          imageUrl={current.imageUrl}
          title={current.title}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17130f]/90 to-transparent p-5 text-white">
          <p className="text-xs font-black uppercase text-[#ffd770]">Hot Pick</p>
          <h2 className="mt-1 line-clamp-2 text-2xl font-black">{current.title}</h2>
          <p className="mt-2 text-sm font-bold text-white/80">{current.vtuberName} / {current.authorName}</p>
          <p className="mt-3 inline-flex rounded-md bg-white/12 px-3 py-2 text-sm font-black backdrop-blur-md">{current.metricLabel} {current.metricValue}</p>
        </div>
        {items.length > 1 ? (
          <div className="absolute right-4 top-4 flex gap-2">
            <button className="icon-button bg-white/85" type="button" onClick={() => go(-1)} title="上一张"><ChevronLeft size={18} /></button>
            <button className="icon-button bg-white/85" type="button" onClick={() => go(1)} title="下一张"><ChevronRight size={18} /></button>
          </div>
        ) : null}
      </div>
      {items.length > 1 ? (
        <div className="flex gap-2 p-3">
          {items.map((item, index) => (
            <button
              key={item.id}
              className={`h-2 flex-1 rounded-full transition ${index === active ? "bg-[#ff5b2e]" : "bg-black/10 hover:bg-black/20"}`}
              type="button"
              onClick={() => setActive(index)}
              title={item.title}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}