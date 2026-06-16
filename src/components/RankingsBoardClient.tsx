"use client";

import { useState } from "react";
import { RankingImagePreview } from "@/components/RankingImagePreview";

type RankedSubmission = {
  authorName: string;
  id: string;
  imageUrl: string;
  title: string;
  track: "SFW" | "NSFW";
  votes: number;
  vtuberName: string;
};

function RankingBoard({ list, title }: { list: RankedSubmission[]; title: string }) {
  const top = list.slice(0, 3);
  const rest = list.slice(3, 10);
  const topStyles = [
    { image: "aspect-[4/3]", rank: "text-4xl", shell: "lg:mt-0" },
    { image: "aspect-[4/3]", rank: "text-3xl", shell: "lg:mt-4" },
    { image: "aspect-[4/3]", rank: "text-2xl", shell: "lg:mt-8" },
  ];

  return (
    <section className="panel grid gap-5 p-5">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="grid items-end gap-4 md:grid-cols-3">
        {top.map((submission, index) => (
          <article key={submission.id} className={`${topStyles[index].shell} overflow-hidden rounded-lg bg-white shadow-sm`}>
            <div className="relative">
              <RankingImagePreview imageUrl={submission.imageUrl} title={submission.title} imageClassName={`${topStyles[index].image} w-full bg-[#fffaf2] object-cover object-top`} />
              <span className={`absolute left-3 top-3 rounded-md bg-[#ff5b2e] px-3 py-2 font-display ${topStyles[index].rank} leading-none text-white shadow-lg`}>#{index + 1}</span>
            </div>
            <div className="grid gap-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">{submission.title}</h3>
                  <p className="text-sm font-bold text-[#6d6258]">{submission.vtuberName} / {submission.authorName}</p>
                </div>
                <span className="shrink-0 rounded-md bg-black/5 px-3 py-2 font-black text-[#ff5b2e]">{submission.votes} 票</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      {rest.length ? (
        <ol className="grid gap-3 md:grid-cols-2">
          {rest.map((submission, index) => (
            <li key={submission.id} className="grid grid-cols-[64px_1fr] items-center gap-3 rounded-lg bg-white/75 p-3 sm:grid-cols-[72px_1fr_auto]">
              <RankingImagePreview imageUrl={submission.imageUrl} title={submission.title} imageClassName="size-16 rounded-md object-cover" />
              <span><b>#{index + 4} {submission.title}</b><br /><small className="text-[#6d6258]">{submission.vtuberName} / {submission.authorName}</small></span>
              <span className="col-span-2 w-fit font-black text-[#ff5b2e] sm:col-span-1">{submission.votes}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

export function RankingsBoardClient({ submissions }: { submissions: RankedSubmission[] }) {
  const [board, setBoard] = useState<"all" | "sfw" | "nsfw">("sfw");
  const buttons = [
    ["all", "总榜"],
    ["sfw", "SFW"],
    ["nsfw", "NSFW"],
  ] as const;
  const activeIndex = Math.max(0, buttons.findIndex(([value]) => value === board));
  const activeTrack = board === "sfw" ? "SFW" : board === "nsfw" ? "NSFW" : undefined;
  const activeList = submissions.filter((submission) => !activeTrack || submission.track === activeTrack).slice(0, 10);
  const activeTitle = activeTrack ? `${activeTrack} 赛道` : "总榜";

  return (
    <div className="grid gap-6">
      <div className="segmented-slider w-full sm:w-auto sm:min-w-72 sm:justify-self-end" style={{ "--segments": buttons.length, "--active-index": activeIndex } as React.CSSProperties}>
        <span className="segmented-indicator" aria-hidden="true" />
        {buttons.map(([value, label]) => (
          <button
            key={value}
            className={`segmented-slider-option ${board === value ? "is-active text-white" : "text-[#5b5047]"}`}
            type="button"
            onClick={() => setBoard(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <RankingBoard list={activeList} title={activeTitle} />
    </div>
  );
}
