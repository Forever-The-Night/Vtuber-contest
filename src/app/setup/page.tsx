import { redirect } from "next/navigation";
import { bootstrapAdmin } from "@/app/actions";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) redirect("/");

  return (
    <main className="page-shell grid place-items-center">
      <form action={bootstrapAdmin} className="panel grid w-full max-w-md gap-5 p-6">
        <div>
          <h1 className="text-2xl font-black">创建首位管理员</h1>
          <p className="mt-2 text-sm font-medium text-[#6d6258]">仅在数据库没有任何用户时可用。</p>
        </div>
        <label className="field">QQ 号<input className="input" name="qq" required /></label>
        <label className="field">站内昵称<input className="input" name="nickname" required /></label>
        <label className="field">密码<input className="input" name="password" type="password" required /></label>
        <button className="button" type="submit">创建并登录</button>
      </form>
    </main>
  );
}