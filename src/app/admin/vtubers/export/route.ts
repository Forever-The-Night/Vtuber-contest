import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  const names = await prisma.vtuberName.findMany({ where: { enabled: true }, orderBy: { name: "asc" } });
  return new Response(`\uFEFF${names.map((item) => item.name).join("\n")}`, {
    headers: {
      "Content-Disposition": "attachment; filename=vtuber-names.txt",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}