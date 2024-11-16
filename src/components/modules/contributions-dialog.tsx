'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { Button, Dialog, Flex, Text } from '@radix-ui/themes';

import Label from '@/element/label';

import { chunk } from '@/util/array';
import { TEnhancedUserWithStats, TIssue, TPullRequest } from '@/util/schemas';

export interface ContributionsDialogProps extends Dialog.RootProps {
  user: TEnhancedUserWithStats;
}

const ContributionsDialog = ({ user, children, ...props }: ContributionsDialogProps) => {
  const [page, setPage] = useState(0);

  const issuesAndPRsChunks = useMemo((): (TIssue | TPullRequest)[][] => {
    const sortedIssuesAndPRs = [...(user.issues ?? []), ...(user.pullRequests ?? [])].toSorted(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return chunk(sortedIssuesAndPRs, 10);
  }, [user.issues, user.pullRequests]);

  const issuesAndPRs = useMemo(() => issuesAndPRsChunks[page] ?? [], [issuesAndPRsChunks, page]);
  const maxPage = useMemo(() => issuesAndPRsChunks.length, [issuesAndPRsChunks]);

  return (
    <Dialog.Root {...props}>
      <Dialog.Trigger>{children}</Dialog.Trigger>

      <Dialog.Content maxWidth="450px">
        <Dialog.Title>{user.name ?? user.login} contributions</Dialog.Title>
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
            <Flex direction="column" className="divide-y divide-gray-4">
              {issuesAndPRs.map((issueOrPR) => (
                <Flex
                  key={issueOrPR.id}
                  direction="column"
                  py="2"
                  gap="1"
                  className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-grayA-2"
                  asChild
                >
                  {/* TODO: Add the href */}
                  <Link href="#" target="_blank">
                    <Text size="1">{issueOrPR.title}</Text>
                    <Flex gap="1" wrap="wrap">
                      {'labels' in issueOrPR &&
                        issueOrPR.labels.map((label) => <Label key={label.name + label.color} label={label} />)}
                    </Flex>
                  </Link>
                </Flex>
              ))}
            </Flex>

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
          </>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ContributionsDialog;
