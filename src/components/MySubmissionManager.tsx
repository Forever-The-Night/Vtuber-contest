"use client";

import { Track } from "@prisma/client";
import { deleteOwnSubmission, updateOwnSubmission } from "@/app/actions";
import { VtuberTagInput } from "@/components/VtuberTagInput";

type MySubmission = {
  id: string;
  title: string;
  imageUrl: string;
  track: "SFW" | "NSFW";
  vtuberName: string;
  description: string | null;
  modelName: string | null;
  negativePrompt: string | null;
  prompt: string | null;
  seed: string | null;
  toolName: string | null;
  votes: number;
};

export function MySubmissionManager({ submissions, vtuberNames }: { submissions: MySubmission[]; vtuberNames: string[] }) {
  if (!submissions.length) {
    return <div className="panel grid min-h-52 place-items-center p-8 text-center font-bold text-[#6d6258]">你还没有投稿。</div>;
  }

  return (
    <div className="grid gap-4">
      {submissions.map((submission) => (
        <details key={submission.id} className="panel overflow-hidden">
          <summary className="grid cursor-pointer grid-cols-[72px_1fr] items-center gap-3 p-3 sm:grid-cols-[96px_1fr_auto] sm:gap-4 sm:p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={submission.imageUrl} alt={submission.title} className="size-18 rounded-md object-cover sm:size-24" />
            <span>
              <b className="text-lg text-[#17130f]">{submission.title}</b><br />
              <small className="font-bold text-[#6d6258]">{submission.track} / {submission.vtuberName}</small>
            </span>
            <span className="col-span-2 w-fit rounded-md bg-black/5 px-3 py-2 text-sm font-black text-[#ff5b2e] sm:col-span-1">{submission.votes} 票</span>
          </summary>
          <div className="grid gap-4 border-t border-black/10 p-4 lg:grid-cols-[1fr_220px]">
            <form action={updateOwnSubmission} className="grid gap-3">
              <input type="hidden" name="submissionId" value={submission.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <label className="field">标题<input className="input" name="title" defaultValue={submission.title} required /></label>
                <label className="field">VTuber 名称
                  <VtuberTagInput initialValues={submission.vtuberName.split("、")} options={vtuberNames} required />
                </label>
                <label className="field">赛道
                  <select className="input" name="track" defaultValue={submission.track}>
                    <option value={Track.SFW}>SFW</option>
                    <option value={Track.NSFW}>NSFW</option>
                  </select>
                </label>
                <label className="field">工具<input className="input" name="toolName" defaultValue={submission.toolName ?? ""} /></label>
                <label className="field">模型<input className="input" name="modelName" defaultValue={submission.modelName ?? ""} /></label>
                <label className="field">Seed<input className="input" name="seed" defaultValue={submission.seed ?? ""} /></label>
              </div>
              <label className="field">作品说明<textarea className="input min-h-20" name="description" defaultValue={submission.description ?? ""} /></label>
              <label className="field">Prompt<textarea className="input min-h-24" name="prompt" defaultValue={submission.prompt ?? ""} /></label>
              <label className="field">Negative Prompt<textarea className="input min-h-20" name="negativePrompt" defaultValue={submission.negativePrompt ?? ""} /></label>
              <button className="button w-fit" type="submit">保存修改</button>
            </form>
            <form
              action={deleteOwnSubmission}
              className="grid content-start gap-3 rounded-lg bg-red-50 p-4"
              onSubmit={(event) => {
                if (!window.confirm(`确认删除“${submission.title}”？图片文件也会删除。`)) event.preventDefault();
              }}
            >
              <input type="hidden" name="submissionId" value={submission.id} />
              <h3 className="font-black text-red-800">删除作品</h3>
              <p className="text-sm font-bold text-red-700">删除后会移除作品、评论、投票以及图片文件。</p>
              <button className="button bg-red-800 text-white" type="submit">删除作品</button>
            </form>
          </div>
        </details>
      ))}
    </div>
  );
}