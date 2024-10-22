import SCORE from '@/constant/score';

import { UserWithStats, UserWithStatsAndScore } from '@/type/github';

/**
 * Calculate the score of the user from its stats
 * @param user The user to calculate the score from
 */
export const getScore = (user: UserWithStats): number => {
  const reviewedMrScore = user.reviewedMrs.count;
  const mrScore = user.mrs.count - reviewedMrScore;
  const prScore = user.prs.count - mrScore;

  return (
    user.commits * SCORE.COMMIT_FACTOR +
    user.issues.count * SCORE.ISSUES_FACTOR +
    prScore * SCORE.PR_FACTOR +
    mrScore * SCORE.MR_FACTOR +
    reviewedMrScore * SCORE.REVIEWED_MR_FACTOR
  );
};

/**
 * Map the score to the contributors
 * @param contributors The contributors to map the score to
 */
export const getContributorsWithScore = (contributors: UserWithStats[]): UserWithStatsAndScore[] => {
  return contributors.map((row) => ({ ...row, score: getScore(row) }));
};

/**
 * Get the contributors sorted by score
 * @param contributors The contributors to sort
 */
export const getSortedContributors = (contributors: UserWithStatsAndScore[]): UserWithStatsAndScore[] => {
  return contributors
    .toSorted((a, b) => b.commits - a.commits)
    .toSorted((a, b) => b.prs.count - a.prs.count)
    .toSorted((a, b) => b.mrs.count - a.mrs.count)
    .toSorted((a, b) => b.score - a.score);
};
