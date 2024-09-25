'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { Badge, Button, Dialog, Flex, Text } from '@radix-ui/themes';
import { emojify } from 'node-emoji';

import { chunk } from '@/util/array';
import { hexToRGB } from '@/util/style';

import { UserWithStats } from '@/type/github';

export interface ContributionsDialogProps extends Dialog.RootProps {
  user: UserWithStats;
}

const ContributionsDialog = ({ user, children, ...props }: ContributionsDialogProps) => {
  const [page, setPage] = useState(0);

  const issuesAndPRsChunks = useMemo(() => {
    const sortedIssuesAndPRs = [...user.issues.data, ...user.prs.data].toSorted(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return chunk(sortedIssuesAndPRs, 10);
  }, [user.issues.data, user.prs.data]);

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
              {issuesAndPRs.map(({ title, url, labels }) => (
                <Flex
                  key={url}
                  direction="column"
                  py="2"
                  gap="1"
                  className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-grayA-2"
                  asChild
                >
                  <Link href={url}>
                    <Text size="1">{title}</Text>
                    <Flex gap="1" wrap="wrap">
                      {labels.map(({ name, color: rawColor }) => {
                        const isWhite = rawColor === 'ffffff';

                        const color = `#${rawColor}`;
                        const rgbColor = hexToRGB(color);
                        const background = `rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, .2)`;

                        return (
                          <Badge size="1" key={name} color="gray" style={!isWhite ? { background, color } : undefined}>
                            {emojify(name)}
                          </Badge>
                        );
                      })}
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
