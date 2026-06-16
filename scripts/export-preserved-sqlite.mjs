import { mkdir, writeFile } from "fs/promises";
import path from "path";

process.env.SQLITE_DATABASE_URL ??= `file:${path.join(process.cwd(), "prisma", "dev.db").replaceAll("\\", "/")}`;

const { PrismaClient } = await import("./generated/sqlite-client/index.js");
const prisma = new PrismaClient();

try {
  const data = {
    exportedAt: new Date().toISOString(),
    users: await prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    whitelistEntries: await prisma.whitelistEntry.findMany({ orderBy: { createdAt: "asc" } }),
    vtuberNames: await prisma.vtuberName.findMany({ orderBy: { name: "asc" } }),
  };
  const outputPath = path.join(process.cwd(), "data", "preserved-data.json");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(data, null, 2));
  console.log(`Exported ${data.users.length} users, ${data.whitelistEntries.length} whitelist entries, ${data.vtuberNames.length} VTuber names to ${outputPath}`);
} finally {
  await prisma.$disconnect();
}