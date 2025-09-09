'use client';

import { useMemo, useState } from 'react';

import { ArrowLeft, ArrowRight } from 'lucide-react';

import Label from '@/elements/label';

import useGetScoreFactors from '@/hooks/use-get-score-factors';

import { chunk } from '@/utils/array';
import { TEnhancedUserWithStats, TIssue, TPullRequest } from '@/utils/schemas';
import { getIssueOrPRScore } from '@/utils/score';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';

export interface ContributionsDialogProps extends React.ComponentProps<typeof Dialog> {
  user: TEnhancedUserWithStats;
}

const ContributionsDialog = ({ user, children, ...props }: ContributionsDialogProps) => {
  const { data: scoreFactors } = useGetScoreFactors();

  const [page, setPage] = useState(0);

  const issuesAndPRsChunks = useMemo((): (TIssue | TPullRequest)[][] => {
    const sortedIssuesAndPRs = [...(user.issues ?? []), ...(user.pullRequests ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return chunk(sortedIssuesAndPRs, 7);
  }, [user.issues, user.pullRequests]);

  const issuesAndPRs = useMemo(() => issuesAndPRsChunks[page] ?? [], [issuesAndPRsChunks, page]);
  const maxPage = useMemo(() => issuesAndPRsChunks.length, [issuesAndPRsChunks]);

  return (
    <Dialog {...props}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-[550px]">
        <DialogTitle>{user.name || user.login} contributions</DialogTitle>
        <DialogDescription className="mb-4">Get information about all the contribution</DialogDescription>

        {maxPage === 0 ? (
          <div className="flex items-center justify-center py-6">
            <span className="text-muted-foreground text-sm italic">Could not find any contributions...</span>
          </div>
        ) : (
          <>
            <Table>
              <TableBody>
                {issuesAndPRs.map((issueOrPR) => (
                  <TableRow
                    key={issueOrPR.url}
                    onClick={() => window.open(issueOrPR.url, '_blank')}
                    className="hover:bg-muted/50 cursor-pointer transition-all duration-300 ease-in-out"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1 py-2">
                        <span className="text-xs break-words">{issueOrPR.title}</span>
                        <div className="flex flex-wrap gap-1">
                          {'labels' in issueOrPR &&
                            issueOrPR.labels.map((label) => <Label key={label.name + label.color} label={label} />)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex h-full flex-col justify-center gap-1 py-2 text-xs">
                        <span>+{getIssueOrPRScore(issueOrPR, scoreFactors)} points</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex w-full items-center justify-between">
              <Button disabled={!page} onClick={() => setPage((p) => p - 1)} className="w-1/3" variant="secondary">
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>

              <span className="text-sm">
                {page + 1}/{maxPage}
              </span>

              <Button
                disabled={page + 1 === maxPage}
                onClick={() => setPage((p) => p + 1)}
                className="w-1/3"
                variant="secondary"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <Table className="mt-3">
              <TableBody>
                <TableRow>
                  <TableHead>Commits score</TableHead>
                  <TableCell className="text-right">
                    {user.TotalCommits * (scoreFactors?.commitFactor ?? 0)} points
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>PRs score</TableHead>
                  <TableCell className="text-right">{user.TotalPrs * (scoreFactors?.prFactor ?? 0)} points</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>Reviewed MRs score</TableHead>
                  <TableCell className="text-right">
                    {user.TotalReviewedPullRequests * (scoreFactors?.reviewedPrFactor ?? 0)} points
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>Issues score</TableHead>
                  <TableCell className="text-right">
                    {user.TotalIssues * (scoreFactors?.issueFactor ?? 0)} points
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">{user.score} points</TableHead>
                </TableRow>
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContributionsDialog;
