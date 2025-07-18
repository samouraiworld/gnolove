'use client';

import { useMemo } from 'react';

import Image from 'next/image';
import NextLink from 'next/link';

import { Box, Flex, Grid, Heading, Spinner, Text } from '@radix-ui/themes';

import MilestoneProgress from '@/features/milestone-progress';

import LayoutContainer from '@/layouts/layout-container';

import IssuesTable from '@/modules/issues-table';
import PrsTable from '@/modules/prs-table';
import UserTable from '@/modules/user-table';

import YoutubeEmbeddedVideo from '@/elements/youtube-embedded-video';

import useGetContributors from '@/hooks/use-get-contributors';
import useGetLastIssues from '@/hooks/use-get-last-issues';
import useGetMilestone from '@/hooks/use-get-milestone';
import useGetNewContributors from '@/hooks/use-get-new-contributors';

import { getLastMRs, TimeFilter } from '@/utils/github';

import REPOSITORY from '@/constants/repository';
import VIDEOS from '@/constants/videos';

import HeaderImage from '@/images/header.png';

import Scoreboard from '@/features/scoreboard/scoreboard';
import { useOffline } from '@/contexts/offline-context';
import { cn } from '@/utils/style';

const ScoreboardPage = () => {
  const { data: allTimeContributors, isPending: isAllTimePending } = useGetContributors({
    timeFilter: TimeFilter.ALL_TIME,
  });

  const { data: milestone } = useGetMilestone();
  const { data: issues, isPending: isIssuesPending } = useGetLastIssues();
  const { data: newContributors, isPending: isNewContributorsPending } = useGetNewContributors();

  const lastMRs = useMemo(() => getLastMRs(allTimeContributors ?? [], 5), [allTimeContributors]);

  const { isOffline } = useOffline();

  return (
    <LayoutContainer>
      <Box>
        <Image
          src={HeaderImage}
          alt="Minecraft heart on top of the words 'Gnolove Community Leaderboard'"
          className="h-full min-h-[200px] w-full object-cover"
        />
      </Box>

      {milestone && (
        <NextLink className={cn(isOffline && 'pointer-events-none')} href="/milestone">
          <MilestoneProgress milestone={milestone} />
        </NextLink>
      )}

      <Grid columns={{ initial: '1', md: '3' }} gap="4">
        <Flex direction="column" gap="4">
          <Heading as="h2" weight="bold" size="6" mt="6" asChild>
            <NextLink
              href={`https://github.com/${REPOSITORY.owner}/${REPOSITORY.repository}/labels/help%20wanted`}
              target="_blank"
            >
              👋 Help Wanted!
            </NextLink>
          </Heading>
          {isIssuesPending ? <Spinner /> : <IssuesTable issues={issues ?? []} showLabels="on-hover" />}
        </Flex>

        <Flex direction="column" gap="4">
          <Heading as="h2" weight="bold" size="6" mt="6">
            ✔️ Freshly Merged
          </Heading>
          {isAllTimePending ? <Spinner /> : <PrsTable prs={lastMRs} />}
        </Flex>

        <Flex direction="column" gap="4">
          <Heading as="h2" weight="bold" size="6" mt="6">
            ⭐ New Rising gnome
          </Heading>
          {isNewContributorsPending ? <Spinner /> : <UserTable users={newContributors ?? []} />}
        </Flex>
      </Grid>

      <Flex justify="center" align="center" mt="6">
        <Heading size="6" className="text-center">
          🏅 Gnolove Scoreboard
        </Heading>
      </Flex>

      <Scoreboard />

      <Text weight="bold" size="6" mt="6">
        🎥 Latest gnoland videos
      </Text>

      <Grid columns={{ initial: '1', xs: '2', md: '3' }} rows="auto" gap="2">
        {VIDEOS.map((src) => (
          <YoutubeEmbeddedVideo key={src} className="overflow-hidden rounded-4" src={src} />
        ))}
      </Grid>
    </LayoutContainer>
  );
};

export default ScoreboardPage;
