import { registerUser } from "@/app/actions";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="page-shell grid place-items-center">
      <form action={registerUser} className="panel grid w-full max-w-md gap-5 p-6">
        <div>
          <h1 className="text-2xl font-black">白名单注册</h1>
          <p className="mt-2 text-sm font-medium text-[#6d6258]">QQ 号必须存在于管理员导入的白名单 CSV。</p>
        </div>
        {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-black text-red-700">{error}</p> : null}
        <label className="field">QQ 号<input className="input" name="qq" required /></label>
        <label className="field">站内昵称<input className="input" name="nickname" required /></label>
        <label className="field">密码<input className="input" name="password" type="password" required /></label>
        <label className="field">邀请码<input className="input" name="inviteCode" placeholder="当前默认不强制" /></label>
        <button className="button" type="submit">注册并登录</button>
      </form>
    </main>
  );
}