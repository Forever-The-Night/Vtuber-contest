import { rm, mkdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function countState() {
  return {
    users: await prisma.user.count(),
    whitelist: await prisma.whitelistEntry.count(),
    vtubers: await prisma.vtuberName.count(),
    contests: await prisma.contest.count(),
    submissions: await prisma.submission.count(),
    votes: await prisma.vote.count(),
  };
}

try {
  const before = await countState();

  await prisma.viewEvent.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.contest.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.adminAuditLog.deleteMany();

  const uploadRoot = path.join(process.cwd(), "public", "uploads");
  await rm(uploadRoot, { recursive: true, force: true });
  await mkdir(uploadRoot, { recursive: true });

  const after = await countState();
  console.log(JSON.stringify({ after, before }, null, 2));
} finally {
  await prisma.$disconnect();
}