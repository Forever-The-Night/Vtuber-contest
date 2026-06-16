import { changeOwnPasswordWithResult } from "@/app/actions";
import { ActionResultForm } from "@/components/ActionResultForm";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { createdAt: true, nickname: true, qq: true, role: true },
  });

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="panel grid content-start gap-4 p-5">
        <h1 className="text-3xl font-black">账户设置</h1>
        <div className="grid gap-3 text-sm font-bold text-[#6d6258]">
          <p>昵称：<span className="text-[#17130f]">{user?.nickname ?? sessionUser.nickname}</span></p>
          <p>QQ：<span className="text-[#17130f]">{user?.qq ?? sessionUser.qq}</span></p>
          <p>角色：<span className="text-[#17130f]">{user?.role ?? sessionUser.role}</span></p>
          {user ? <p>注册时间：<span className="text-[#17130f]">{formatDateTime(user.createdAt)}</span></p> : null}
        </div>
      </section>

      <ActionResultForm action={changeOwnPasswordWithResult} className="panel grid content-start gap-4 p-5" successMessage="密码已更新。">
        <h2 className="text-xl font-black">修改密码</h2>
        <label className="field">当前密码<input className="input" name="currentPassword" type="password" required /></label>
        <label className="field">新密码<input className="input" name="newPassword" type="password" minLength={6} required /></label>
        <label className="field">确认新密码<input className="input" name="confirmPassword" type="password" minLength={6} required /></label>
        <button className="button" type="submit">保存新密码</button>
      </ActionResultForm>
    </main>
  );
}