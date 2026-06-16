import { csvResponse } from "@/lib/export/csv";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export async function GET() {
  await requireAdmin();
  const submissions = await prisma.submission.findMany({
    include: { _count: { select: { comments: true, viewEvents: true, votes: true } }, author: { select: { nickname: true, qq: true } }, contest: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return csvResponse("submissions.csv", [
    ["时间", "届次", "标题", "作者", "QQ", "赛道", "VTuber", "状态", "票数", "浏览", "评论", "工具", "模型", "Seed", "图片"],
    ...submissions.map((submission) => [
      formatDateTime(submission.createdAt),
      submission.contest.title,
      submission.title,
      submission.author.nickname,
      submission.author.qq,
      submission.track,
      submission.vtuberName,
      submission.status,
      submission._count.votes,
      submission._count.viewEvents,
      submission._count.comments,
      submission.toolName ?? "",
      submission.modelName ?? "",
      submission.seed ?? "",
      submission.imageUrl,
    ]),
  ]);
}