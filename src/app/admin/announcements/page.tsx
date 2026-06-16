import { createAnnouncementWithResult, deleteAnnouncementWithResult, updateAnnouncementWithResult } from "@/app/actions";
import { ActionResultForm } from "@/components/ActionResultForm";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    include: { author: { select: { nickname: true } } },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <ActionResultForm action={createAnnouncementWithResult} className="panel grid content-start gap-4 p-5" successMessage="公告已发布。">
        <h2 className="text-xl font-black">发布公告</h2>
        <label className="field">标题<input className="input" name="title" required /></label>
        <label className="field">内容<textarea className="input min-h-44" name="body" required /></label>
        <label className="inline-flex items-center gap-2 font-bold"><input name="enabled" type="checkbox" defaultChecked /> 启用展示</label>
        <label className="inline-flex items-center gap-2 font-bold"><input name="pinned" type="checkbox" /> 置顶公告</label>
        <button className="button" type="submit">发布公告</button>
      </ActionResultForm>

      <section className="grid content-start gap-4">
        {announcements.length ? announcements.map((announcement) => (
          <article key={announcement.id} className="panel grid gap-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{announcement.title}</h2>
                <p className="mt-1 text-sm font-bold text-[#6d6258]">
                  {announcement.enabled ? "展示中" : "已停用"} / {announcement.pinned ? "置顶" : "普通"} / {announcement.author?.nickname ?? "未知管理员"} / {formatDateTime(announcement.updatedAt)}
                </p>
              </div>
              <span className={`rounded-md px-3 py-2 text-sm font-black ${announcement.enabled ? "bg-[#e4fbf4] text-[#006b64]" : "bg-black/5 text-[#6d6258]"}`}>
                {announcement.enabled ? "ON" : "OFF"}
              </span>
            </div>
            <ActionResultForm action={updateAnnouncementWithResult} className="grid gap-3 rounded-lg bg-white/60 p-4" successMessage="公告已保存。">
              <input type="hidden" name="announcementId" value={announcement.id} />
              <label className="field">标题<input className="input" name="title" defaultValue={announcement.title} required /></label>
              <label className="field">内容<textarea className="input min-h-36" name="body" defaultValue={announcement.body} required /></label>
              <div className="flex flex-wrap gap-4 text-sm font-black">
                <label className="inline-flex items-center gap-2"><input name="enabled" type="checkbox" defaultChecked={announcement.enabled} /> 启用展示</label>
                <label className="inline-flex items-center gap-2"><input name="pinned" type="checkbox" defaultChecked={announcement.pinned} /> 置顶公告</label>
              </div>
              <button className="button w-fit" type="submit">保存公告</button>
            </ActionResultForm>
            <ActionResultForm action={deleteAnnouncementWithResult} successMessage="公告已删除。">
              <input type="hidden" name="announcementId" value={announcement.id} />
              <button className="button bg-red-800 text-white" type="submit">删除公告</button>
            </ActionResultForm>
          </article>
        )) : (
          <div className="panel grid min-h-64 place-items-center p-8 text-center font-bold text-[#6d6258]">还没有公告。</div>
        )}
      </section>
    </div>
  );
}