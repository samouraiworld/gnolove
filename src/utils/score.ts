import { TEnhancedUserWithStats, TIssue, TPullRequest, TCommit, TReview, TScoreFactors } from '@/utils/schemas';

/**
 * Get the score of an issue or PR
 * @param issueOrPR The issue or PR to get the score from
 */
export const getContributionScore = (contribution: TIssue | TPullRequest | TCommit | TReview, scoreFactors?: TScoreFactors) => {
  if ('assignees' in contribution) return scoreFactors?.issueFactor;
  if ('reviews' in contribution) return scoreFactors?.prFactor;
  if ('pullRequestID' in contribution) return scoreFactors?.reviewedPrFactor;
  return scoreFactors?.commitFactor;
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
