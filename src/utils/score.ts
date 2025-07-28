import { TEnhancedUserWithStats, TIssue, TPullRequest } from '@/utils/schemas';

import SCORE from '@/constants/score';

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
 * Get the contributors sorted by score
 * @param contributors The contributors to sort
 */
export const getSortedContributors = (contributors: TEnhancedUserWithStats[]): TEnhancedUserWithStats[] => {
  return contributors
    .toSorted((a, b) => b.TotalCommits - a.TotalCommits)
    .toSorted((a, b) => b.TotalReviewedPullRequests - a.TotalReviewedPullRequests)
    .toSorted((a, b) => b.TotalPrs - a.TotalPrs)
    .toSorted((a, b) => b.TotalIssues - a.TotalIssues)
    .toSorted((a, b) => b.score - a.score);
};
