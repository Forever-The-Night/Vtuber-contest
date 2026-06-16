import { adminUpdateUserPasswordWithResult } from "@/app/actions";
import { ActionResultForm } from "@/components/ActionResultForm";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { _count: { select: { submissions: true, votes: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <section className="grid gap-4">
      {users.map((user) => (
        <article key={user.id} className="panel grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">{user.nickname}</h2>
              <span className="rounded-md bg-black/5 px-2 py-1 text-xs font-black text-[#5b5047]">{user.role}</span>
            </div>
            <div className="mt-3 grid gap-1 text-sm font-bold text-[#6d6258]">
              <span>QQ：{user.qq}</span>
              <span>注册：{formatDateTime(user.createdAt)}</span>
              <span>作品：{user._count.submissions} / 投票：{user._count.votes}</span>
            </div>
          </div>
          <ActionResultForm action={adminUpdateUserPasswordWithResult} className="grid content-start gap-3 rounded-lg bg-white/60 p-4" successMessage="密码已更新。">
            <input type="hidden" name="userId" value={user.id} />
            <label className="field">设置新密码<input className="input" name="newPassword" type="password" minLength={6} required /></label>
            <button className="button secondary" type="submit">更新密码</button>
          </ActionResultForm>
        </article>
      ))}
    </section>
  );
}