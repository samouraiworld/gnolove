import SCORE from '@/constant/score';

import { UserWithStats, UserWithStatsAndScore } from '@/type/github';

export const getScore = (user: UserWithStats): number => {
  return (
    user.commits * SCORE.COMMIT_FACTOR +
    user.issues.count * SCORE.ISSUES_FACTOR +
    (user.prs.count - user.mrs.count) * SCORE.PR_FACTOR +
    user.mrs.count * SCORE.MR_FACTOR
  );
};

export const getSortedContributorsWithScore = (contributors: UserWithStats[]): UserWithStatsAndScore[] => {
  return contributors
    .map((row) => ({ ...row, score: getScore(row) }))
    .toSorted((a, b) => b.mrs.count - a.mrs.count)
    .toSorted((a, b) => b.prs.count - a.prs.count)
    .toSorted((a, b) => b.commits - a.commits)
    .toSorted((a, b) => b.score - a.score);
};
