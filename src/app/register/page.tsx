import type { Metadata } from "next";
import { registerUser } from "@/app/actions";
import { getInviteRequiredSetting } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "注册",
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const inviteRequired = await getInviteRequiredSetting();

  return (
    <main className="page-shell grid place-items-center">
      <form action={registerUser} className="panel grid w-full max-w-md gap-5 p-6">
        <div>
          <h1 className="text-2xl font-black">白名单注册</h1>
          <p className="mt-2 text-sm font-medium text-[#6d6258]">QQ 号必须存在群白名单中。不要小号注册口牙！</p>
          <p className="mt-1 text-xs font-bold text-[#6d6258]">{inviteRequired ? "当前已开启邀请码注册" : "当前未开启邀请码强制校验"}</p>
        </div>
        {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-black text-red-700">{error}</p> : null}
        <label className="field">QQ 号<input className="input" name="qq" required /></label>
        <label className="field">站内昵称<input className="input" name="nickname" required /></label>
        <label className="field">密码<input className="input" name="password" type="password" required /></label>
        <label className="field">邀请码<input className="input" name="inviteCode" required={inviteRequired} placeholder={inviteRequired ? "私聊@岁己SUI 发送 邀请码 获取" : "未开启时可留空"} /></label>
        <button className="button" type="submit">注册并登录</button>
      </form>
    </main>
  );
}