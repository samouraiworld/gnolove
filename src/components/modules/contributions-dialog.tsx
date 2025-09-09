'use client';

import { useMemo } from 'react';

import useGetScoreFactors from '@/hooks/use-get-score-factors';

import { chunk } from '@/utils/array';
import { TEnhancedUserWithStats, TIssue, TPullRequest } from '@/utils/schemas';
import { getIssueOrPRScore } from '@/utils/score';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface ContributionsDialogProps extends React.ComponentProps<typeof Tooltip> {
  user: TEnhancedUserWithStats;
}

const ContributionsDialog = ({ user, children, ...props }: ContributionsDialogProps) => {
  const { data: scoreFactors } = useGetScoreFactors();

  const issuesAndPRsChunks = useMemo((): (TIssue | TPullRequest)[][] => {
    const sortedIssuesAndPRs = [...(user.issues ?? []), ...(user.pullRequests ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return chunk(sortedIssuesAndPRs, 7);
  }, [user.issues, user.pullRequests]);

  const issuesAndPRs = useMemo(() => issuesAndPRsChunks[0] ?? [], [issuesAndPRsChunks]);

  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-[360px]">
        <div className="space-y-2">
          <div>
            <p className="font-semibold text-xs">{user.name || user.login} — score breakdown</p>
            <p className="text-[11px] opacity-90">
              PRs: {user.TotalPrs} × {scoreFactors?.prFactor ?? '-'} • Issues: {user.TotalIssues} × {scoreFactors?.issueFactor ?? '-'}
            </p>
            <p className="text-[11px] opacity-90">
              Reviews: {user.TotalReviewedPullRequests} × {scoreFactors?.reviewedPrFactor ?? '-'} • Commits: {user.TotalCommits} × {scoreFactors?.commitFactor ?? '-'}
            </p>
            <p className="text-[11px] mt-1">Total: {user.score} points</p>
          </div>
          {issuesAndPRs.length > 0 ? (
            <div>
              <p className="font-semibold text-xs mb-1">Recent activity</p>
              <ul className="space-y-1">
                {issuesAndPRs.map((item) => (
                  <li key={item.url} className="flex items-start justify-between gap-2">
                    <span className="truncate text-[11px]" title={item.title}>
                      {item.title}
                    </span>
                    <span className="shrink-0 text-[11px]">+{getIssueOrPRScore(item as any, scoreFactors)} pts</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-[11px] italic opacity-80">No recent contributions</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default ContributionsDialog;
