"use client";

import { useState } from "react";
import { ActionErrorDialog } from "@/components/ActionErrorDialog";
import { MessageCircleQuestion, QrCode } from "lucide-react";

export function GroupJoinGate({
  qrCodeUrl,
  question,
  questionEnabled,
}: {
  qrCodeUrl: string | null;
  question: string;
  questionEnabled: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "passed">(questionEnabled ? "idle" : "passed");
  const [error, setError] = useState<string>();
  const [dismissedErrorId, setDismissedErrorId] = useState<number>();
  const visibleError = error && dismissedErrorId !== 1 ? error : undefined;

  async function verifyAnswer(event: React.FormEvent) {
    event.preventDefault();
    setStatus("checking");
    setError(undefined);
    setDismissedErrorId(undefined);
    try {
      const response = await fetch("/api/group/verify", {
        body: JSON.stringify({ answer }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; ok?: boolean };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "验证失败，请稍后重试。");
      setStatus("passed");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "验证失败，请稍后重试。");
    }
  }

  return (
    <section className="panel grid gap-5 p-6">
      <ActionErrorDialog error={visibleError} onClose={() => setDismissedErrorId(1)} />
      {status === "passed" ? (
        <div className="grid gap-4">
          <p className="inline-flex items-center gap-2 rounded-md bg-[#e4fbf4] px-3 py-2 text-sm font-black text-[#006b64]">
            <QrCode size={16} /> 验证通过，扫码加入交流群：
          </p>
          {qrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCodeUrl} alt="加群二维码" className="mx-auto max-h-96 rounded-lg border border-black/10 bg-white p-3 shadow-sm" decoding="async" />
          ) : (
            <p className="rounded-md bg-black/5 p-4 text-sm font-bold text-[#6d6258]">二维码尚未上传，请联系管理员。</p>
          )}
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={verifyAnswer}>
          <div>
            <h2 className="inline-flex items-center gap-2 text-xl font-black">
              <MessageCircleQuestion size={20} /> 入群验证
            </h2>
            <p className="mt-2 text-sm font-bold leading-7 text-[#6d6258]">{question || "请回答以下问题："}</p>
          </div>
          <label className="field">
            你的答案
            <input className="input" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="输入答案" required disabled={status === "checking"} />
          </label>
          <button className="button w-fit" type="submit" disabled={status === "checking"}>
            {status === "checking" ? "验证中…" : "提交答案"}
          </button>
        </form>
      )}
    </section>
  );
}
