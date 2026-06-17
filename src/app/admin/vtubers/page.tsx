import type { Metadata } from "next";
import Link from "next/link";
import { addVtuberNameWithResult, importVtubersWithResult } from "@/app/actions";
import { ActionResultForm } from "@/components/ActionResultForm";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VTuber 名单",
};

export default async function AdminVtubersPage() {
  const names = await prisma.vtuberName.findMany({ orderBy: { name: "asc" }, take: 500 });
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <div className="grid content-start gap-4">
        <ActionResultForm action={importVtubersWithResult} className="panel grid content-start gap-4 p-5" successMessage="名单已导入。">
          <h2 className="text-xl font-black">导入 VTuber 名字 TXT</h2>
          <p className="text-sm font-bold text-[#6d6258]">每行一个官方完整名字。</p>
          <input className="input" type="file" name="file" accept=".txt,text/plain" required />
          <button className="button" type="submit">导入</button>
        </ActionResultForm>
        <ActionResultForm action={addVtuberNameWithResult} className="panel grid content-start gap-4 p-5" successMessage="名字已添加。">
          <h2 className="text-xl font-black">单条添加名字</h2>
          <label className="field">官方完整名字<input className="input" name="name" required /></label>
          <div className="flex flex-wrap gap-3">
            <button className="button" type="submit">添加</button>
            <Link className="button secondary" href="/admin/vtubers/export">导出 TXT</Link>
          </div>
        </ActionResultForm>
      </div>
      <section className="panel flex flex-wrap gap-2 p-5">
        {names.map((item) => <span key={item.id} className="rounded-md bg-white px-3 py-2 text-sm font-bold">{item.name}</span>)}
      </section>
    </div>
  );
}