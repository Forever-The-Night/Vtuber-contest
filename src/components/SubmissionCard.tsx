"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionErrorDialog } from "@/components/ActionErrorDialog";
import { emitVoteQuotaChange } from "@/components/VoteQuotaPanel";
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
  canManageTrack?: boolean;
  showVotes?: boolean;
};

export function SubmissionCard({
  authorName,
  canManageTrack = false,
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(track);
  const [optimisticVote, setOptimisticVote] = useState({ hasVoted, votes });
  const [isVoting, setIsVoting] = useState(false);
  const [isUpdatingTrack, setIsUpdatingTrack] = useState(false);
  const [voteError, setVoteError] = useState<string>();
  const [dismissedErrorId, setDismissedErrorId] = useState<number>();
  const visibleError = voteError && dismissedErrorId !== 1 ? voteError : undefined;

  async function toggleTrack() {
    if (!canManageTrack || isUpdatingTrack) return;
    const previous = currentTrack;
    const nextTrack = previous === "NSFW" ? "SFW" : "NSFW";
    setVoteError(undefined);
    setDismissedErrorId(undefined);
    setIsUpdatingTrack(true);
    setCurrentTrack(nextTrack);

    try {
      const response = await fetch("/api/submissions/track", {
        body: JSON.stringify({ submissionId: id, track: nextTrack }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; track?: TrackName };
      if (!response.ok) throw new Error(payload.error ?? "赛道修改失败，请稍后重试。");
      if (payload.track) setCurrentTrack(payload.track);
      router.refresh();
    } catch (error) {
      setCurrentTrack(previous);
      setVoteError(error instanceof Error ? error.message : "赛道修改失败，请稍后重试。");
    } finally {
      setIsUpdatingTrack(false);
    }
  }

  async function toggleVote() {
    if (isVoting) return;
    const previous = optimisticVote;
    const nextHasVoted = !previous.hasVoted;
    setVoteError(undefined);
    setDismissedErrorId(undefined);
    setIsVoting(true);
    setOptimisticVote({
      hasVoted: nextHasVoted,
      votes: Math.max(0, previous.votes + (nextHasVoted ? 1 : -1)),
    });

    try {
      const response = await fetch("/api/votes/toggle", {
        body: JSON.stringify({ submissionId: id }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; hasVoted?: boolean };
      if (!response.ok) throw new Error(payload.error ?? "投票没有完成，请稍后重试。");
      if (typeof payload.hasVoted === "boolean" && payload.hasVoted !== nextHasVoted) {
        setOptimisticVote(previous);
      } else {
        emitVoteQuotaChange(currentTrack, nextHasVoted ? 1 : -1);
      }
    } catch (error) {
      setOptimisticVote(previous);
      setVoteError(error instanceof Error ? error.message : "投票没有完成，请稍后重试。");
    } finally {
      setIsVoting(false);
    }
  }

  function closeModal() {
    setOpen(false);
  }

  const trackBadgeClass = `inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-black ${currentTrack === "NSFW" ? "bg-[#1b1515] text-white" : "bg-[#e4fbf4] text-[#006b64]"}`;
  const trackBadgeContent = <>{currentTrack === "NSFW" ? <Lock size={12} /> : <Sparkles size={12} />}{currentTrack}</>;

  return (
    <>
      <ActionErrorDialog error={visibleError} onClose={() => setDismissedErrorId(1)} />
      <article className={`gallery-item overflow-hidden rounded-lg border shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl ${optimisticVote.hasVoted ? "border-[#d9a441] bg-[#fff4cf]" : "border-black/10 bg-white/80"}`}>
        <button className="block w-full text-left" type="button" onClick={() => setOpen(true)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={title} className="w-full bg-[#eadfd0] object-cover" loading="lazy" decoding="async" />
        </button>
        <div className="grid gap-3 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="line-clamp-2 font-bold text-[#17130f]">{title}</h3>
              <p className="text-sm text-[#6d6258]">{vtuberName} / {authorName}</p>
            </div>
            {canManageTrack ? (
              <button className={`${trackBadgeClass} transition hover:scale-105`} type="button" aria-busy={isUpdatingTrack} title="切换 SFW / NSFW" onClick={toggleTrack}>{trackBadgeContent}</button>
            ) : (
              <span className={trackBadgeClass}>{trackBadgeContent}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#6d6258]">
            <span className="inline-flex items-center gap-1"><Eye size={14} /> {views}</span>
            <span className="inline-flex items-center gap-1"><MessageCircle size={14} /> {comments}</span>
            {showVotes ? <span className="ml-auto text-2xl font-black leading-none text-[#b97900]">{optimisticVote.votes}<small className="ml-1 text-xs text-[#6d6258]">赞</small></span> : null}
          </div>
          {canVote ? (
            <button className={`button vote-button w-full ${optimisticVote.hasVoted ? "has-voted bg-[#d9a441] text-[#17130f]" : ""}`} type="button" aria-busy={isVoting} onClick={toggleVote}><ThumbsUp size={16} /> {optimisticVote.hasVoted ? "取消投票" : "投票"}</button>
          ) : null}
        </div>
      </article>

      {open ? (
        <div className="modal-backdrop fixed inset-0 z-50 grid place-items-center bg-[#17130f]/55 p-4 backdrop-blur-md" role="dialog" aria-modal="true" onMouseDown={closeModal}>
          <div className="modal-surface grid max-h-[92dvh] w-full max-w-6xl overflow-hidden rounded-lg bg-[#fffaf2] shadow-2xl lg:grid-cols-[minmax(0,1fr)_360px]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="overflow-auto bg-[#201a16]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={title} className="mx-auto max-h-[52dvh] w-auto max-w-full object-contain lg:max-h-[92dvh]" decoding="async" />
            </div>
            <aside className="grid max-h-[40dvh] content-start gap-4 overflow-auto p-4 lg:max-h-[92dvh] lg:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {canManageTrack ? (
                    <button className={`${trackBadgeClass} transition hover:scale-105`} type="button" aria-busy={isUpdatingTrack} title="切换 SFW / NSFW" onClick={toggleTrack}>{trackBadgeContent}</button>
                  ) : (
                    <span className="inline-flex rounded-md bg-black/5 px-2 py-1 text-xs font-black">{currentTrack}</span>
                  )}
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
                <button className={`button vote-button w-full ${optimisticVote.hasVoted ? "has-voted bg-[#d9a441] text-[#17130f]" : ""}`} type="button" aria-busy={isVoting} onClick={toggleVote}><ThumbsUp size={16} /> {optimisticVote.hasVoted ? "取消投票" : "给这张投票"}</button>
              ) : null}
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}