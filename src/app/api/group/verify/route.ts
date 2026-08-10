import { NextResponse } from "next/server";
import { getGroupConfig } from "@/lib/group-config";

export async function POST(request: Request) {
  try {
    const config = await getGroupConfig();
    if (!config?.enabled) {
      return NextResponse.json({ error: "加群入口暂未开放。" }, { status: 404 });
    }

    if (!config.questionEnabled) {
      return NextResponse.json({ ok: true, qrCodeUrl: config.qrCodeUrl });
    }

    const body = await request.json().catch(() => ({})) as { answer?: unknown };
    const answer = typeof body.answer === "string" ? body.answer.trim().toLowerCase() : "";
    const expected = config.answer?.trim().toLowerCase() ?? "";
    if (!expected || answer === expected) {
      return NextResponse.json({ ok: true, qrCodeUrl: config.qrCodeUrl });
    }

    return NextResponse.json({ error: "答案不正确，请再想想。" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "验证失败，请稍后重试。" }, { status: 500 });
  }
}
