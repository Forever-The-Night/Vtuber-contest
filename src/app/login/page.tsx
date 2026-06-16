import { loginUser } from "@/app/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="page-shell grid place-items-center">
      <form action={loginUser} className="panel grid w-full max-w-md gap-5 p-6">
        <div>
          <h1 className="text-2xl font-black">登录</h1>
          <p className="mt-2 text-sm font-medium text-[#6d6258]">使用已注册的 QQ 号和密码进入投稿与 NSFW 赛道。</p>
        </div>
        {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-black text-red-700">{error}</p> : null}
        <label className="field">QQ 号<input className="input" name="qq" required /></label>
        <label className="field">密码<input className="input" name="password" type="password" required /></label>
        <button className="button" type="submit">登录</button>
      </form>
    </main>
  );
}