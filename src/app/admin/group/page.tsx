import type { Metadata } from "next";
import { updateGroupConfigWithResult } from "@/app/actions";
import { ActionResultForm } from "@/components/ActionResultForm";
import { getGroupConfig } from "@/lib/group-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "加群设置",
};

export default async function AdminGroupPage() {
  const config = await getGroupConfig();

  return (
    <ActionResultForm action={updateGroupConfigWithResult} className="panel grid content-start gap-4 p-5" successMessage="加群设置已保存。">
      <h2 className="text-xl font-black">加群设置</h2>
      <label className="inline-flex items-center gap-2 font-bold">
        <input name="enabled" type="checkbox" defaultChecked={config?.enabled ?? true} />
        开启加群入口
      </label>
      <label className="field">
        正文
        <textarea className="input min-h-32" name="body" defaultValue={config?.body ?? ""} placeholder="显示在加群页面的说明文字，可多行" />
      </label>

      <hr className="border-black/10" />
      <h3 className="font-black">入群问答</h3>
      <label className="inline-flex items-center gap-2 font-bold">
        <input name="questionEnabled" type="checkbox" defaultChecked={config?.questionEnabled ?? false} />
        开启问答验证
      </label>
      <label className="field">
        问题
        <input className="input" name="question" defaultValue={config?.question ?? ""} placeholder="例如：本次比赛的主题是什么？" />
      </label>
      <label className="field">
        答案
        <input className="input" name="answer" defaultValue={config?.answer ?? ""} placeholder="正确答案（不区分大小写）" />
      </label>
      <p className="text-xs font-bold text-[#6d6258]">未填写答案时，问答不会拦截任何人。答案仅保存在服务端，不会展示在前端。</p>

      <hr className="border-black/10" />
      <h3 className="font-black">加群二维码</h3>
      {config?.qrCodeUrl ? (
        <div className="grid gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={config.qrCodeUrl} alt="当前二维码" className="max-h-52 w-fit rounded-md border border-black/10 bg-white p-1" decoding="async" />
          <label className="inline-flex items-center gap-2 text-sm font-bold text-red-700">
            <input name="clearQrCode" type="checkbox" />
            清除当前二维码
          </label>
        </div>
      ) : (
        <p className="rounded-md bg-black/5 p-3 text-sm font-bold text-[#6d6258]">尚未上传二维码。</p>
      )}
      <label className="field">
        上传新二维码
        <input className="input" name="qrCode" type="file" accept="image/png,image/jpeg,image/webp" />
      </label>

      <button className="button w-fit" type="submit">保存加群设置</button>
    </ActionResultForm>
  );
}
