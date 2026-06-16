import { SubmissionStatus } from "@prisma/client";
import { csvResponse } from "@/lib/export/csv";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  await requireAdmin();
  const submissions = await prisma.submission.findMany({
    where: { status: SubmissionStatus.ACTIVE },
    include: { _count: { select: { votes: true } }, author: { select: { nickname: true, qq: true } }, contest: { select: { title: true } } },
  });
  const ranked = submissions.sort((a, b) => b._count.votes - a._count.votes);

  return csvResponse("rankings.csv", [
    ["排名", "届次", "标题", "作者", "QQ", "赛道", "VTuber", "票数", "图片"],
    ...ranked.map((submission, index) => [index + 1, submission.contest.title, submission.title, submission.author.nickname, submission.author.qq, submission.track, submission.vtuberName, submission._count.votes, submission.imageUrl]),
  ]);
}