import { unstable_cache } from "next/cache";
import { getContestPhase } from "@/lib/contest/rules";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getGroupConfig } from "@/lib/group-config";

export const layoutNavigationTag = "layout-navigation";

export const getLayoutNavigationData = unstable_cache(
  async () => {
    const [contest, announcements, groupConfig] = await Promise.all([
      prisma.contest.findFirst({ orderBy: { submissionStartAt: "desc" } }),
      prisma.announcement.findMany({
        orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        take: 10,
        where: { enabled: true },
      }),
      getGroupConfig(),
    ]);
    const phase = contest ? getContestPhase(contest) : null;

    return {
      announcements: announcements.map((announcement) => ({
        body: announcement.body,
        id: announcement.id,
        pinned: announcement.pinned,
        title: announcement.title,
        updatedAt: formatDateTime(announcement.updatedAt),
      })),
      canEnterSubmit: phase === "submissions" || phase === "voting",
      canEnterVote: phase === "voting",
      groupEnabled: groupConfig?.enabled ?? false,
    };
  },
  ["layout-navigation"],
  { revalidate: 30, tags: [layoutNavigationTag] },
);