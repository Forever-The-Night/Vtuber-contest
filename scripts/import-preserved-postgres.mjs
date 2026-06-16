import { readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(process.cwd(), "data", "preserved-data.json");
const data = JSON.parse(await readFile(inputPath, "utf8"));

try {
  for (const user of data.users ?? []) {
    await prisma.user.upsert({
      where: { qq: user.qq },
      update: {
        avatarUrl: user.avatarUrl,
        nickname: user.nickname,
        passwordHash: user.passwordHash,
        role: user.role,
      },
      create: {
        avatarUrl: user.avatarUrl,
        createdAt: new Date(user.createdAt),
        id: user.id,
        nickname: user.nickname,
        passwordHash: user.passwordHash,
        qq: user.qq,
        role: user.role,
        updatedAt: new Date(user.updatedAt),
      },
    });
  }

  for (const entry of data.whitelistEntries ?? []) {
    await prisma.whitelistEntry.upsert({
      where: { qq: entry.qq },
      update: { inviteCode: entry.inviteCode },
      create: {
        createdAt: new Date(entry.createdAt),
        id: entry.id,
        inviteCode: entry.inviteCode,
        qq: entry.qq,
        updatedAt: new Date(entry.updatedAt),
      },
    });
  }

  for (const vtuber of data.vtuberNames ?? []) {
    await prisma.vtuberName.upsert({
      where: { name: vtuber.name },
      update: { enabled: vtuber.enabled },
      create: {
        createdAt: new Date(vtuber.createdAt),
        enabled: vtuber.enabled,
        id: vtuber.id,
        name: vtuber.name,
        updatedAt: new Date(vtuber.updatedAt),
      },
    });
  }

  console.log(`Imported ${data.users?.length ?? 0} users, ${data.whitelistEntries?.length ?? 0} whitelist entries, ${data.vtuberNames?.length ?? 0} VTuber names.`);
} finally {
  await prisma.$disconnect();
}