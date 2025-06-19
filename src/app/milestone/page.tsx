import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CalendarIcon, PersonIcon } from '@radix-ui/react-icons';
import { Avatar, Badge, BadgeProps, Box, Card, Flex, Grid, Heading, Link, Separator, Text, Tooltip } from '@radix-ui/themes';
import { formatDistanceToNow } from 'date-fns';

import MilestoneProgress from '@/feature/milestone-progress';

import LayoutContainer from '@/layout/layout-container';

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
      <MilestoneProgress milestone={milestone} mt='5' />

      <Heading as='h1' size='8' my='4'>
        {milestone.title}
      </Heading>

      <RadixMarkdown>{milestone.description}</RadixMarkdown>

      <Grid columns={{ initial: '1', md: '2' }} gap='4' mt='6'>
        {milestone.issues.sort(cmpCreatedAt).map((issue) => (
          <Card key={issue.id} size='2' variant='surface'>
            <Box>
              <Flex align='start' justify='between' mb='3'>
                <Box>
                  <Flex align='center' gap='2' mb='2'>
                    <Link href={issue.url} target='_blank'>
                      <Text size='2' color='gray'>
                        #{issue.number}
                      </Text>
                    </Link>
                    <Badge size='1' color={issue.state === 'OPEN' ? 'green' : 'gray'} variant='soft'>
                      {issue.state}
                    </Badge>
                  </Flex>
                  <Link href={issue.url} target='_blank'>
                    <Text size='3' weight='medium'>
                      {issue.title}
                    </Text>
                  </Link>
                </Box>
              </Flex>

              {issue.labels.length > 0 && (
                <Flex gap='1' mb='3' wrap='wrap'>
                  {issue.labels.map((label, index) => (
                    <Badge key={index} size='1' color={label.color as BadgeProps['color']} variant='soft'>
                      {label.name}
                    </Badge>
                  ))}
                </Flex>
              )}

              <Separator size='4' mb='3' />

              <Flex direction='column' gap='4'>
                <Flex align='center' justify='between'>
                  <Flex align='center' gap='2'>
                    <Avatar size='1' src={issue.author?.avatarUrl} fallback={<PersonIcon />} />
                    <Text size='2' color='gray'>
                      {issue.author?.login}
                    </Text>
                  </Flex>
                  <Flex align='center' gap='1'>
                    <CalendarIcon width='12' height='12' color='gray' />
                    <Text size='1' color='gray'>
                      {formatDistanceToNow(issue.createdAt, { addSuffix: true })}
                    </Text>
                  </Flex>
                </Flex>
                {issue.assignees.length > 0 && (
                  <Flex gap='1' wrap='wrap' align='center'>
                    <Text size='2' color='gray'>
                      Assignees:
                    </Text>
                    {issue.assignees.map(({ user }) => (
                      <Tooltip content={user.login} key={user.id}>
                        <Avatar size='1' src={user.avatarUrl} fallback={<PersonIcon />} />
                      </Tooltip>
                    ))}
                  </Flex>
                )}
              </Flex>
            </Box>
          </Card>
        ))}
      </Grid>
    </LayoutContainer>
  );
};

export default MilestonePage;
