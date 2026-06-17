import type { Metadata } from "next";
import { VoteMode } from "@prisma/client";
import { createContestWithResult, setContestPhaseWithResult, updateContestWithResult } from "@/app/actions";
import { ActionResultForm } from "@/components/ActionResultForm";
import { ContestDeleteForm } from "@/components/ContestDeleteForm";
import { PhaseBadge } from "@/components/PhaseBadge";
import { prisma } from "@/lib/db";
import { formatDateTime, toDateTimeLocalValue } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "比赛管理",
};

function CreateContestForm({ className, defaults, titleClassName }: { className: string; defaults: Array<[string, [string, string]]>; titleClassName: string }) {
  return (
    <ActionResultForm action={createContestWithResult} className={className} successMessage="届次已创建。">
      <h2 className={titleClassName}>创建比赛届次</h2>
      <label className="field">标题<input className="input" name="title" required /></label>
      <label className="field">主题描述<textarea className="input min-h-24" name="description" placeholder="例如：夏日祭、城市夜景、偶像舞台等" /></label>
      {defaults.map(([label, [name, value]]) => (
        <label key={name} className="field">{label}<input className="input" name={name} type="datetime-local" defaultValue={value} required /></label>
      ))}
      <label className="inline-flex items-center gap-2 font-bold"><input name="showVotesDuringVoting" type="checkbox" /> 投票期显示票数</label>
      <label className="inline-flex items-center gap-2 font-bold"><input name="showRanksDuringVoting" type="checkbox" /> 投票期显示排名</label>
      <label className="field">投票模式
        <select className="input" name="voteMode" defaultValue={VoteMode.SIMPLE}>
          <option value={VoteMode.SIMPLE}>一次性总票数</option>
          <option value={VoteMode.DAILY_POOL}>每日票数</option>
        </select>
      </label>
      <label className="field">SFW 本届总票数<input className="input" name="sfwTotalVoteLimit" type="number" min="1" defaultValue={20} /></label>
      <label className="field">NSFW 本届总票数<input className="input" name="nsfwTotalVoteLimit" type="number" min="1" defaultValue={20} /></label>
      <label className="field">SFW 每日票数<input className="input" name="sfwDailyVoteLimit" type="number" min="1" defaultValue={20} /></label>
      <label className="field">NSFW 每日票数<input className="input" name="nsfwDailyVoteLimit" type="number" min="1" defaultValue={20} /></label>
      <button className="button" type="submit">创建届次</button>
    </ActionResultForm>
  );
}

export default async function AdminContestsPage() {
  const contests = await prisma.contest.findMany({ orderBy: { submissionStartAt: "desc" } });
  const now = new Date();
  const defaults = {
    投稿开始时间: ["submissionStartAt", toDateTimeLocalValue(now)],
    投稿结束时间: ["submissionEndAt", toDateTimeLocalValue(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7))],
    投票开始时间: ["votingStartAt", toDateTimeLocalValue(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 8))],
    投票结束时间: ["votingEndAt", toDateTimeLocalValue(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 15))],
    结果公布时间: ["resultsAt", toDateTimeLocalValue(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 16))],
  };
  const defaultEntries = Object.entries(defaults) as Array<[string, [string, string]]>;
  const dateFields = [
    ["投稿开始时间", "submissionStartAt"],
    ["投稿结束时间", "submissionEndAt"],
    ["投票开始时间", "votingStartAt"],
    ["投票结束时间", "votingEndAt"],
    ["结果公布时间", "resultsAt"],
  ] as const;

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <details className="contest-create-collapse panel overflow-hidden xl:hidden">
        <summary className="flex cursor-pointer items-center justify-between gap-3 p-5 font-black xl:hidden">
          <span>创建比赛届次</span>
          <span className="rounded-md bg-black/5 px-3 py-1 text-sm text-[#6d6258]">展开</span>
        </summary>
        <CreateContestForm className="contest-create-form grid content-start gap-4 p-5" defaults={defaultEntries} titleClassName="sr-only" />
      </details>
      <CreateContestForm className="panel hidden content-start gap-4 p-5 xl:grid" defaults={defaultEntries} titleClassName="text-xl font-black" />
      <section className="grid content-start gap-4">
        {contests.map((contest) => (
          <article key={contest.id} className="panel grid gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">{contest.title}</h2><PhaseBadge contest={contest} /></div>
            <p className="text-sm font-medium text-[#6d6258]">{contest.description}</p>
            <div className="mt-4 grid gap-1 text-sm font-bold text-[#6d6258]">
              <span>投稿：{formatDateTime(contest.submissionStartAt)} - {formatDateTime(contest.submissionEndAt)}</span>
              <span>投票：{formatDateTime(contest.votingStartAt)} - {formatDateTime(contest.votingEndAt)}</span>
              <span>公布：{formatDateTime(contest.resultsAt)}</span>
            </div>
            <ActionResultForm action={updateContestWithResult} className="grid gap-3 rounded-lg bg-white/60 p-4" successMessage="届次设置已保存。">
              <input type="hidden" name="contestId" value={contest.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <label className="field">项目名<input className="input" name="title" defaultValue={contest.title} required /></label>
                <label className="field">主题描述<input className="input" name="description" defaultValue={contest.description ?? ""} placeholder="例如：夏日祭、城市夜景、偶像舞台等" /></label>
                {dateFields.map(([label, name]) => (
                  <label key={name} className="field">{label}<input className="input" name={name} type="datetime-local" defaultValue={toDateTimeLocalValue(contest[name])} required /></label>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-sm font-black">
                <label className="inline-flex items-center gap-2"><input name="showVotesDuringVoting" type="checkbox" defaultChecked={contest.showVotesDuringVoting} /> 投票期显示票数</label>
                <label className="inline-flex items-center gap-2"><input name="showRanksDuringVoting" type="checkbox" defaultChecked={contest.showRanksDuringVoting} /> 投票期显示排名</label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="field">投票模式
                  <select className="input" name="voteMode" defaultValue={contest.voteMode}>
                    <option value={VoteMode.SIMPLE}>一次性总票数</option>
                    <option value={VoteMode.DAILY_POOL}>每日票数</option>
                  </select>
                </label>
                <label className="field">SFW 本届总票数<input className="input" name="sfwTotalVoteLimit" type="number" min="1" defaultValue={contest.sfwTotalVoteLimit} /></label>
                <label className="field">NSFW 本届总票数<input className="input" name="nsfwTotalVoteLimit" type="number" min="1" defaultValue={contest.nsfwTotalVoteLimit} /></label>
                <label className="field">SFW 每日票数<input className="input" name="sfwDailyVoteLimit" type="number" min="1" defaultValue={contest.sfwDailyVoteLimit} /></label>
                <label className="field">NSFW 每日票数<input className="input" name="nsfwDailyVoteLimit" type="number" min="1" defaultValue={contest.nsfwDailyVoteLimit} /></label>
              </div>
              <button className="button w-fit" type="submit">保存届次设置</button>
            </ActionResultForm>
            <ActionResultForm action={setContestPhaseWithResult} className="flex flex-wrap items-end gap-3 rounded-lg bg-white/60 p-4" successMessage="阶段已切换。">
              <input type="hidden" name="contestId" value={contest.id} />
              <label className="field w-full sm:w-52">提前切换阶段
                <select className="input" name="phase" defaultValue="voting">
                  <option value="scheduled">未开始</option>
                  <option value="submissions">投稿期</option>
                  <option value="voting">投票期</option>
                  <option value="locked">封榜整理</option>
                  <option value="results">结果公布</option>
                </select>
              </label>
              <button className="button secondary" type="submit">应用阶段</button>
            </ActionResultForm>
            <ContestDeleteForm contestId={contest.id} title={contest.title} />
          </article>
        ))}
      </section>
    </div>
  );
}