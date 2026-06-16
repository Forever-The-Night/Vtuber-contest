import { Contest, Submission, SubmissionStatus, Track } from "@prisma/client";
import { SessionUser } from "@/lib/auth/session";

export function getContestPhase(contest: Contest, now = new Date()) {
  if (now < contest.submissionStartAt) return "scheduled";
  if (now <= contest.submissionEndAt) return "submissions";
  if (now < contest.votingStartAt) return "between";
  if (now <= contest.votingEndAt) return "voting";
  if (now < contest.resultsAt) return "locked";
  return "results";
}

export function canViewSubmission(
  submission: Pick<Submission, "authorId" | "status" | "track">,
  contest: Contest,
  user: SessionUser | null,
) {
  if (submission.status !== SubmissionStatus.ACTIVE) return false;
  if (submission.track === Track.NSFW && !user) return false;

  const phase = getContestPhase(contest);
  if (phase === "submissions") {
    return user?.id === submission.authorId;
  }

  return phase === "voting" || phase === "locked" || phase === "results";
}

export function canSubmit(contest: Contest, now = new Date()) {
  return getContestPhase(contest, now) === "submissions";
}

export function shouldShowVotes(contest: Contest, now = new Date()) {
  const phase = getContestPhase(contest, now);
  return phase === "results" || (phase === "voting" && contest.showVotesDuringVoting);
}

export function shouldShowRanks(contest: Contest, now = new Date()) {
  const phase = getContestPhase(contest, now);
  return phase === "results" || (phase === "voting" && contest.showRanksDuringVoting);
}