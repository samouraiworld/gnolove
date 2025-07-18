import { TEnhancedUserWithStats, TEnhancedUserWithStatsAndScore, TIssue, TPullRequest } from '@/utils/schemas';

import SCORE from '@/constants/score';

/**
 * Calculate the score of the user from its stats
 * @param user The user to calculate the score from
 */
export const getScore = (user: TEnhancedUserWithStats): number => {
  return (
    user.TotalCommits * SCORE.COMMIT_FACTOR +
    user.TotalIssues * SCORE.ISSUES_FACTOR +
    user.TotalPrs * SCORE.PR_FACTOR +
    user.TotalReviewedPullRequests * SCORE.REVIEWED_MR_FACTOR
  );
};

/**
 * Get the score of an issue or PR
 * @param issueOrPR The issue or PR to get the score from
 */
export const getIssueOrPRScore = (issueOrPR: TIssue | TPullRequest) => {
  const isIssue = 'assignees' in issueOrPR;

  if (isIssue) return SCORE.ISSUES_FACTOR;
  return SCORE.PR_FACTOR;
};

/**
 * Map the score to the contributors
 * @param contributors The contributors to map the score to
 */
export const getContributorsWithScore = (contributors: TEnhancedUserWithStats[]): TEnhancedUserWithStatsAndScore[] => {
  return contributors.map((row) => ({ ...row, score: getScore(row) }));
};

/**
 * Get the contributors sorted by score
 * @param contributors The contributors to sort
 */
export const getSortedContributors = (
  contributors: TEnhancedUserWithStatsAndScore[],
): TEnhancedUserWithStatsAndScore[] => {
  return contributors
    .toSorted((a, b) => b.TotalCommits - a.TotalCommits)
    .toSorted((a, b) => b.TotalReviewedPullRequests - a.TotalReviewedPullRequests)
    .toSorted((a, b) => b.TotalPrs - a.TotalPrs)
    .toSorted((a, b) => b.TotalIssues - a.TotalIssues)
    .toSorted((a, b) => b.score - a.score);
};
