"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import { ContestCountdown } from "@/components/ContestCountdown";

type HeroImage = {
  authorName: string;
  id: string;
  imageUrl: string;
  metricLabel: string;
  metricValue: number;
  title: string;
  vtuberName: string;
};

const slideDurationMs = 6000;

export function HomeHeroExperience({
  announcement,
  countdownLabel,
  images,
  phaseLabel,
  primaryHref,
  primaryLabel,
  showSetupLink,
  targetAt,
  themeDescription,
  title,
  subtitle,
}: {
  announcement?: { body: string; title: string } | null;
  countdownLabel: string;
  images: HeroImage[];
  phaseLabel: string;
  primaryHref: string;
  primaryLabel: string;
  showSetupLink: boolean;
  targetAt?: string;
  themeDescription?: string | null;
  title: string;
  subtitle: string;
}) {
  const [active, setActive] = useState(0);
  const [panState, setPanState] = useState<{ imageId?: string; mode: "none" | "x" | "y" }>({ mode: "none" });
  const wheelLockRef = useRef(0);
  const current = images[active];
  const panMode = panState.imageId === current?.id ? panState.mode : "none";

  useEffect(() => {
    if (images.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % images.length);
    }, slideDurationMs);
    return () => window.clearInterval(timer);
  }, [images.length]);

  function go(offset: number) {
    if (images.length < 2) return;
    setActive((index) => (index + offset + images.length) % images.length);
  }

  function onWheel(event: React.WheelEvent<HTMLElement>) {
    if (images.length < 2 || Math.abs(event.deltaY) < 14) return;
    const now = Date.now();
    if (now - wheelLockRef.current < 520) return;
    event.preventDefault();
    wheelLockRef.current = now;
    go(event.deltaY > 0 ? 1 : -1);
  }

  function onMouseMove(event: React.MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--home-mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--home-my", `${event.clientY - rect.top}px`);
  }

  function detectPanMode(event: React.SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    const container = image.parentElement;
    if (!container) return;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const containerRatio = container.clientWidth / container.clientHeight;
    if (Math.abs(imageRatio - containerRatio) < 0.08) {
      setPanState({ imageId: current?.id, mode: "none" });
      return;
    }
    setPanState({ imageId: current?.id, mode: imageRatio > containerRatio ? "x" : "y" });
  }

  return (
    <section className="home-hero" style={{ "--home-slide-duration": `${slideDurationMs}ms` } as React.CSSProperties} onWheel={onWheel} onMouseMove={onMouseMove}>
      <div className="home-orbit home-orbit-a" />
      <div className="home-orbit home-orbit-b" />
      <div className="home-image-stage" aria-live="polite">
        {current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={current.id} src={current.imageUrl} alt={current.title} className={`home-hero-image ${panMode === "x" ? "is-panning-x" : panMode === "y" ? "is-panning-y" : ""}`} decoding="async" fetchPriority="high" onLoad={detectPanMode} />
            <div className="home-image-caption">
              <p className="text-xs font-black uppercase text-[#ffd770]">SFW Featured</p>
              <h2 className="mt-1 line-clamp-2 text-2xl font-black text-white">{current.title}</h2>
              <p className="mt-2 text-sm font-bold text-white/78">{current.vtuberName} / {current.authorName}</p>
              <p className="mt-3 inline-flex rounded-md bg-white/12 px-3 py-2 text-sm font-black text-white backdrop-blur-md">{current.metricLabel} {current.metricValue}</p>
            </div>
          </>
        ) : (
          <div className="home-empty-image">等待 SFW 作品出现</div>
        )}
      </div>

      <div className="home-hero-content">
        <div>
          <p className="mb-4 inline-flex rounded-md bg-[#ff5b2e]/10 px-3 py-2 text-sm font-black uppercase text-[#ff5b2e]">Private VTuber Gallery Contest</p>
          <h1 className="font-display text-6xl leading-none text-[#17130f] sm:text-8xl lg:text-9xl">{title}</h1>
          {themeDescription ? (
            <p className="mt-4 max-w-2xl rounded-lg border border-[#17130f]/10 bg-white/60 px-4 py-3 text-sm font-bold leading-7 text-[#5b5047] backdrop-blur-md">
              本次比赛主题：{themeDescription}
            </p>
          ) : null}
          <p className="mt-6 max-w-xl text-base font-bold leading-8 text-[#5b5047]">{subtitle}</p>
        </div>

        <div className="grid max-w-xl gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-[#17130f] px-3 py-2 text-sm font-black text-white">{phaseLabel}</span>
            <span className="rounded-md bg-white/55 px-3 py-2 text-sm font-black text-[#5b5047] backdrop-blur-md">滚轮切换右侧图片</span>
          </div>
          {announcement ? (
            <div className="home-announcement">
              <p className="inline-flex items-center gap-2 text-sm font-black text-[#ff5b2e]"><Megaphone size={16} /> 最新公告</p>
              <h2 className="mt-2 text-xl font-black text-[#17130f]">{announcement.title}</h2>
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap font-medium leading-7 text-[#5b5047]">{announcement.body}</p>
            </div>
          ) : null}
          {targetAt ? <ContestCountdown label={countdownLabel} targetAt={targetAt} /> : null}
          <div className="flex flex-wrap gap-3">
            {showSetupLink ? <Link href="/setup" className="button">创建首位管理员</Link> : null}
            <Link href={primaryHref} className="button">{primaryLabel} <ArrowRight size={16} /></Link>
            <Link href="/rankings" className="button secondary">查看排名</Link>
          </div>
        </div>
      </div>

      {images.length > 1 ? (
        <div className="home-carousel-controls">
          <button className="icon-button bg-white/85" type="button" onClick={() => go(-1)} title="上一张"><ChevronLeft size={18} /></button>
          <div className="home-dots">
            {images.map((image, index) => (
              <button key={image.id} className={index === active ? "is-active" : ""} type="button" onClick={() => setActive(index)} title={image.title} />
            ))}
          </div>
          <button className="icon-button bg-white/85" type="button" onClick={() => go(1)} title="下一张"><ChevronRight size={18} /></button>
        </div>
      ) : null}
    </section>
  );
}