import type { Metadata } from "next";
import Link from "next/link";
import { addWhitelistEntryWithResult, generateMissingInviteCodesWithResult, importWhitelistWithResult } from "@/app/actions";
import { ActionResultForm } from "@/components/ActionResultForm";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "白名单管理",
};

export default async function AdminWhitelistPage() {
  const entries = await prisma.whitelistEntry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <div className="grid content-start gap-4">
        <ActionResultForm action={importWhitelistWithResult} className="panel grid content-start gap-4 p-5" successMessage="白名单已导入。">
          <h2 className="text-xl font-black">导入 QQ 白名单 CSV</h2>
          <p className="text-sm font-bold text-[#6d6258]">需要列名：qq, inviteCode。CSV 中邀请码为空时不会覆盖已有邀请码。</p>
          <input className="input" type="file" name="file" accept=".csv,text/csv" required />
          <button className="button" type="submit">导入</button>
        </ActionResultForm>
        <ActionResultForm action={addWhitelistEntryWithResult} className="panel grid content-start gap-4 p-5" successMessage="QQ 已添加或更新。">
          <h2 className="text-xl font-black">单条添加 QQ</h2>
          <label className="field">QQ<input className="input" name="qq" required /></label>
          <label className="field">邀请码<input className="input" name="inviteCode" placeholder="可留空，之后一键生成" /></label>
          <button className="button" type="submit">添加 / 更新</button>
        </ActionResultForm>
        <ActionResultForm action={generateMissingInviteCodesWithResult} className="panel grid content-start gap-3 p-5" successMessage="缺失邀请码已生成。">
          <h2 className="text-xl font-black">邀请码</h2>
          <p className="text-sm font-bold text-[#6d6258]">只给没有邀请码的 QQ 生成，已有邀请码不会覆盖。</p>
          <div className="flex flex-wrap gap-3">
            <button className="button" type="submit">一键生成缺失邀请码</button>
            <Link className="button secondary" href="/admin/whitelist/export">导出 CSV</Link>
          </div>
        </ActionResultForm>
      </div>
      <section className="panel overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5"><tr><th className="p-3">QQ</th><th className="p-3">邀请码</th></tr></thead>
          <tbody>{entries.map((entry) => <tr key={entry.id} className="border-t border-black/10"><td className="p-3 font-bold">{entry.qq}</td><td className="p-3 text-[#6d6258]">{entry.inviteCode ?? "-"}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}