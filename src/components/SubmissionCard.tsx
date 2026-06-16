"use client";

import { useActionState, useState } from "react";
import { castVoteWithResult } from "@/app/actions";
import { ActionErrorDialog } from "@/components/ActionErrorDialog";
import { initialActionResult } from "@/lib/actions/result";
import { Eye, Lock, MessageCircle, Sparkles, ThumbsUp, X } from "lucide-react";

type TrackName = "SFW" | "NSFW";

type SubmissionCardProps = {
  id: string;
  title: string;
  imageUrl: string;
  track: TrackName;
  vtuberName: string;
  authorName: string;
  canVote?: boolean;
  description?: string | null;
  hasVoted?: boolean;
  modelName?: string | null;
  negativePrompt?: string | null;
  prompt?: string | null;
  seed?: string | null;
  toolName?: string | null;
  votes?: number;
  views?: number;
  comments?: number;
  showVotes?: boolean;
};

export function SubmissionCard({
  authorName,
  canVote = false,
  comments = 0,
  description,
  hasVoted = false,
  id,
  imageUrl,
  modelName,
  negativePrompt,
  prompt,
  seed,
  showVotes = false,
  title,
  toolName,
  track,
  views = 0,
  votes = 0,
  vtuberName,
}: SubmissionCardProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(castVoteWithResult, initialActionResult);
  const [dismissedErrorId, setDismissedErrorId] = useState<number>();
  const visibleError = state.error && state.errorId !== dismissedErrorId ? state.error : undefined;

  function closeModal() {
    setOpen(false);
  }

  return (
    <>
      <ActionErrorDialog error={visibleError} onClose={() => setDismissedErrorId(state.errorId)} />
      <article className={`gallery-item overflow-hidden rounded-lg border shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl ${hasVoted ? "border-[#d9a441] bg-[#fff4cf]" : "border-black/10 bg-white/80"}`}>
        <button className="block w-full text-left" type="button" onClick={() => setOpen(true)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={title} className="w-full bg-[#eadfd0] object-cover" loading="lazy" />
        </button>
        <div className="grid gap-3 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="line-clamp-2 font-bold text-[#17130f]">{title}</h3>
              <p className="text-sm text-[#6d6258]">{vtuberName} / {authorName}</p>
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-black ${track === "NSFW" ? "bg-[#1b1515] text-white" : "bg-[#e4fbf4] text-[#006b64]"}`}>
              {track === "NSFW" ? <Lock size={12} /> : <Sparkles size={12} />}
              {track}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#6d6258]">
            <span className="inline-flex items-center gap-1"><Eye size={14} /> {views}</span>
            <span className="inline-flex items-center gap-1"><MessageCircle size={14} /> {comments}</span>
            {showVotes ? <span className="ml-auto text-2xl font-black leading-none text-[#b97900]">{votes}<small className="ml-1 text-xs text-[#6d6258]">赞</small></span> : null}
          </div>
          {canVote ? (
            <form action={formAction}>
              <input type="hidden" name="submissionId" value={id} />
              <button className={`button vote-button w-full ${hasVoted ? "has-voted bg-[#d9a441] text-[#17130f]" : ""}`} type="submit"><ThumbsUp size={16} /> {hasVoted ? "取消投票" : "投票"}</button>
            </form>
          ) : null}
        </div>
      </article>

      {open ? (
        <div className="modal-backdrop fixed inset-0 z-50 grid place-items-center bg-[#17130f]/55 p-4 backdrop-blur-md" role="dialog" aria-modal="true" onMouseDown={closeModal}>
          <div className="modal-surface grid max-h-[92dvh] w-full max-w-6xl overflow-hidden rounded-lg bg-[#fffaf2] shadow-2xl lg:grid-cols-[minmax(0,1fr)_360px]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="overflow-auto bg-[#201a16]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={title} className="mx-auto max-h-[52dvh] w-auto max-w-full object-contain lg:max-h-[92dvh]" />
            </div>
            <aside className="grid max-h-[40dvh] content-start gap-4 overflow-auto p-4 lg:max-h-[92dvh] lg:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-md bg-black/5 px-2 py-1 text-xs font-black">{track}</span>
                  <h2 className="mt-3 text-2xl font-black text-[#17130f]">{title}</h2>
                  <p className="mt-1 text-sm font-bold text-[#6d6258]">{vtuberName} / {authorName}</p>
                </div>
                <button className="icon-button" type="button" onClick={closeModal} title="关闭详情">
                  <X size={18} />
                </button>
              </div>
              {description ? <p className="whitespace-pre-wrap rounded-md bg-white/70 p-3 text-sm font-medium text-[#5b5047]">{description}</p> : null}
              <dl className="grid gap-2 text-sm text-[#6d6258]">
                <div><dt className="font-black text-[#17130f]">工具</dt><dd>{toolName ?? "未识别"}</dd></div>
                <div><dt className="font-black text-[#17130f]">模型</dt><dd>{modelName ?? "未识别"}</dd></div>
                <div><dt className="font-black text-[#17130f]">Seed</dt><dd>{seed ?? "未识别"}</dd></div>
              </dl>
              {prompt ? <details><summary className="cursor-pointer font-black">Prompt</summary><p className="mt-2 whitespace-pre-wrap text-sm text-[#6d6258]">{prompt}</p></details> : null}
              {negativePrompt ? <details><summary className="cursor-pointer font-black">Negative Prompt</summary><p className="mt-2 whitespace-pre-wrap text-sm text-[#6d6258]">{negativePrompt}</p></details> : null}
              {canVote ? (
                <form action={formAction}>
                  <input type="hidden" name="submissionId" value={id} />
                  <button className={`button vote-button w-full ${hasVoted ? "has-voted bg-[#d9a441] text-[#17130f]" : ""}`} type="submit"><ThumbsUp size={16} /> {hasVoted ? "取消投票" : "给这张投票"}</button>
                </form>
              ) : null}
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}