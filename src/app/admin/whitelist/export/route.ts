import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  const entries = await prisma.whitelistEntry.findMany({ orderBy: { qq: "asc" } });
  const rows = ["qq,inviteCode", ...entries.map((entry) => `${entry.qq},${entry.inviteCode ?? ""}`)];
  return new Response(`\uFEFF${rows.join("\n")}`, {
    headers: {
      "Content-Disposition": "attachment; filename=qq-whitelist.csv",
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}