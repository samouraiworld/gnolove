import { TEnhancedUserWithStats, TIssue, TPullRequest, TScoreFactors } from '@/utils/schemas';

/**
 * Get the score of an issue or PR
 * @param issueOrPR The issue or PR to get the score from
 */
export const getIssueOrPRScore = (issueOrPR: TIssue | TPullRequest, scoreFactors?: TScoreFactors) => {
  const isIssue = 'assignees' in issueOrPR;

  if (isIssue) return scoreFactors?.issueFactor;
  return scoreFactors?.prFactor;
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
