import { Metadata } from 'next';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowLeftIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import { Avatar, Flex, Heading, Link, Table, Text } from '@radix-ui/themes';
import { formatDistanceToNow } from 'date-fns';
import { CircleDotIcon } from 'lucide-react';

import MilestoneProgress from '@/feature/milestone-progress';

import LayoutContainer from '@/layout/layout-container';

import Label from '@/element/label';
import RadixMarkdown from '@/element/radix-markdown';

import { cmpCreatedAt } from '@/util/github';
import { MilestoneSchema } from '@/util/schemas';

import MILESTONE from '@/constant/milestone';

import ENV from '@/env';

export const metadata: Metadata = {
  title: 'Top of Gnome',
};

const getMilestone = async () => {
  const url = new URL(`/milestones/${MILESTONE.number}`, ENV.NEXT_PUBLIC_API_URL);
  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return MilestoneSchema.parse(data);
};

const MilestonePage = async () => {
  const milestone = await getMilestone();
  if (!milestone) return notFound();

  return (
    <LayoutContainer>
      <MilestoneProgress milestone={milestone} />

      <Flex align="center" gap="2" mt="4" asChild>
        <Link asChild>
          <NextLink href="/">
            <ArrowLeftIcon />
            <Text>Go back to home</Text>
          </NextLink>
        </Link>
      </Flex>

      <Heading as="h1" size="8" my="2">
        {milestone.title}
      </Heading>

      <RadixMarkdown>{milestone.description}</RadixMarkdown>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell className="w-full">Issue</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Assignee(s)</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {milestone.issues.sort(cmpCreatedAt).map((issue) => (
            <Table.Row key={issue.id}>
              <Table.Cell className="max-w-0">
                <Flex width="100%" direction="column" gap="1">
                  <Flex justify="start" align="center" gap="2">
                    {issue.state === 'open' ? (
                      <CircleDotIcon color="green" className="size-3 shrink-0" />
                    ) : (
                      <CheckCircledIcon color="purple" className="size-3 shrink-0" />
                    )}

                    <Text className="w-full" truncate>
                      {issue.title}
                    </Text>

                    <Flex gap="2">
                      {issue.labels.map((label) => (
                        <Label label={label} key={label.id} />
                      ))}
                    </Flex>
                  </Flex>

                  <Text color="gray">
                    #{issue.number} opened {formatDistanceToNow(issue.createdAt, { addSuffix: true })} by{' '}
                    {issue.author?.login ?? 'unknown'}
                  </Text>
                </Flex>
              </Table.Cell>

              <Table.Cell>
                <Flex gap="2" height="100%" align="center" justify="center">
                  {(issue.assignees ?? []).map(({ user: assignee }) => (
                    <Avatar fallback={assignee.login} src={assignee.avatarUrl} key={assignee.id} size="1" />
                  ))}
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </LayoutContainer>
  );
};

export default MilestonePage;
