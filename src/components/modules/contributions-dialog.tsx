'use client';

import { useMemo, useState } from 'react';

import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { Button, Dialog, Flex, Table, Text } from '@radix-ui/themes';

import Label from '@/elements/label';

import { chunk } from '@/utils/array';
import { TEnhancedUserWithStats, TIssue, TPullRequest } from '@/utils/schemas';
import { getIssueOrPRScore } from '@/utils/score';

import useGetScoreFactors from '@/hooks/use-get-score-factors';

export interface ContributionsDialogProps extends Dialog.RootProps {
  user: TEnhancedUserWithStats;
}

const ContributionsDialog = ({ user, children, ...props }: ContributionsDialogProps) => {
  const { data: scoreFactors } = useGetScoreFactors();

  const [page, setPage] = useState(0);

  const issuesAndPRsChunks = useMemo((): (TIssue | TPullRequest)[][] => {
    const sortedIssuesAndPRs = [...(user.issues ?? []), ...(user.pullRequests ?? [])].toSorted(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return chunk(sortedIssuesAndPRs, 7);
  }, [user.issues, user.pullRequests]);

  const issuesAndPRs = useMemo(() => issuesAndPRsChunks[page] ?? [], [issuesAndPRsChunks, page]);
  const maxPage = useMemo(() => issuesAndPRsChunks.length, [issuesAndPRsChunks]);

  return (
    <Dialog.Root {...props}>
      <Dialog.Trigger>{children}</Dialog.Trigger>

      <Dialog.Content maxWidth="550px">
        <Dialog.Title>{user.name || user.login} contributions</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Get information about all the contribution
        </Dialog.Description>

        {maxPage === 0 ? (
          <Flex justify="center" align="center" py="6">
            <Text size="2" color="gray" className="italic">
              Could not find any contributions...
            </Text>
          </Flex>
        ) : (
          <>
            <Table.Root size="1">
              <Table.Body>
                {issuesAndPRs.map((issueOrPR) => (
                  <Table.Row
                    key={issueOrPR.url}
                    onClick={() => window.open(issueOrPR.url, '_blank')}
                    className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-gray-a-2"
                  >
                    <Table.Cell>
                      <Flex direction="column" py="2" gap="1">
                        <Text size="1" className="text-wrap">
                          {issueOrPR.title}
                        </Text>
                        <Flex gap="1" wrap="wrap">
                          {'labels' in issueOrPR &&
                            issueOrPR.labels.map((label) => <Label key={label.name + label.color} label={label} />)}
                        </Flex>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex direction="column" height="100%" justify="center" py="2" gap="1">
                        <Text size="1">+{getIssueOrPRScore(issueOrPR, scoreFactors)} points</Text>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>

            <Flex width="100%" justify="between" align="center" mt="4">
              <Button disabled={!page} onClick={() => setPage((p) => p - 1)} className="w-1/3" variant="soft">
                <ArrowLeftIcon />
                Previous
              </Button>

              <Text>
                {page + 1}/{maxPage}
              </Text>

              <Button
                disabled={page + 1 === maxPage}
                onClick={() => setPage((p) => p + 1)}
                className="w-1/3"
                variant="soft"
              >
                Next
                <ArrowRightIcon />
              </Button>
            </Flex>

            <Table.Root size="1" mt="3">
              <Table.Body>
                <Table.Row>
                  <Table.RowHeaderCell>
                    <Text size="1">Commits score</Text>
                  </Table.RowHeaderCell>
                  <Table.Cell align="right">
                    <Text size="1">{user.TotalCommits * (scoreFactors?.commitFactor ?? 0)} points</Text>
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.RowHeaderCell>
                    <Text size="1">PRs score</Text>
                  </Table.RowHeaderCell>
                  <Table.Cell align="right">
                    <Text size="1">{user.TotalPrs * (scoreFactors?.prFactor ?? 0)} points</Text>
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.RowHeaderCell>
                    <Text size="1">Reviewed MRs score</Text>
                  </Table.RowHeaderCell>
                  <Table.Cell align="right">
                    <Text size="1">{user.TotalReviewedPullRequests * (scoreFactors?.reviewedPrFactor ?? 0)} points</Text>
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.RowHeaderCell>
                    <Text size="1">Issues score</Text>
                  </Table.RowHeaderCell>
                  <Table.Cell align="right">
                    <Text size="1">{user.TotalIssues * (scoreFactors?.issueFactor ?? 0)} points</Text>
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.ColumnHeaderCell>
                    <Text size="1">Total</Text>
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">
                    <Text size="1">{user.score} points</Text>
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
          </>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ContributionsDialog;
