import { csvResponse } from "@/lib/export/csv";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export async function GET() {
  await requireAdmin();
  const votes = await prisma.vote.findMany({
    include: { submission: { select: { title: true, track: true } }, user: { select: { nickname: true, qq: true } } },
    orderBy: { createdAt: "desc" },
  });

  return csvResponse("votes.csv", [
    ["时间", "用户", "QQ", "作品", "赛道", "IP", "UA"],
    ...votes.map((vote) => [formatDateTime(vote.createdAt), vote.user.nickname, vote.user.qq, vote.submission.title, vote.submission.track, vote.ipAddress ?? "", vote.userAgent ?? ""]),
  ]);
}