import { Contest } from "@prisma/client";
import { getContestPhase } from "@/lib/contest/rules";

const labels = {
  scheduled: "未开始",
  submissions: "投稿期",
  between: "等待投票",
  voting: "投票期",
  locked: "封榜整理",
  results: "结果公布",
};

export function PhaseBadge({ contest }: { contest: Contest }) {
  return (
    <span className="inline-flex items-center rounded-md bg-black/5 px-3 py-1 text-sm font-black text-[#5b5047]">
      {labels[getContestPhase(contest)]}
    </span>
  );
}