"use client";

import { deleteContest } from "@/app/actions";

export function ContestDeleteForm({ contestId, title }: { contestId: string; title: string }) {
  return (
    <form
      action={deleteContest}
      className="grid gap-3 rounded-lg border border-red-200 bg-red-50/70 p-4"
      onSubmit={(event) => {
        const form = event.currentTarget;
        const keepFiles = new FormData(form).get("keepFiles") === "on";
        const message = keepFiles
          ? `确认删除届次“${title}”？数据库中的作品、投票、评论会删除，但图片文件会保留。`
          : `确认删除届次“${title}”？数据库记录和已上传图片文件都会删除。`;
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <input type="hidden" name="contestId" value={contestId} />
      <div>
        <h3 className="font-black text-red-800">删除届次</h3>
        <p className="mt-1 text-sm font-bold text-red-700">删除后该届作品、评论、投票会从数据库移除。</p>
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-black text-red-800">
        <input name="keepFiles" type="checkbox" defaultChecked /> 保留已上传图片文件
      </label>
      <button className="button w-fit bg-red-800 text-white" type="submit">删除届次</button>
    </form>
  );
}