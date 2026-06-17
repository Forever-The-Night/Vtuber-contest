import { Track } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "只有管理员可以修改作品赛道。" }, { status: 403 });
  }

  try {
    const body = await request.json() as { submissionId?: unknown; track?: unknown };
    const submissionId = typeof body.submissionId === "string" ? body.submissionId : "";
    const track = body.track === Track.NSFW ? Track.NSFW : body.track === Track.SFW ? Track.SFW : null;
    if (!submissionId || !track) {
      return NextResponse.json({ error: "作品或赛道无效。" }, { status: 400 });
    }

    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: { track },
      select: { id: true, track: true },
    });

    revalidatePath("/vote");
    revalidatePath("/rankings");
    revalidatePath("/admin/submissions");
    revalidatePath(`/submissions/${submission.id}`);
    return NextResponse.json({ track: submission.track });
  } catch {
    return NextResponse.json({ error: "赛道修改失败，请稍后重试。" }, { status: 500 });
  }
}
