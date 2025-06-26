'use client';

import { useMemo } from 'react';

import Image from 'next/image';
import NextLink from 'next/link';

import { Box, Flex, Grid, Heading, Spinner, Text } from '@radix-ui/themes';

import MilestoneProgress from '@/feature/milestone-progress';

import LayoutContainer from '@/layout/layout-container';

import IssuesTable from '@/module/issues-table';
import PrsTable from '@/module/prs-table';
import UserTable from '@/module/user-table';

import YoutubeEmbeddedVideo from '@/element/youtube-embedded-video';

import useGetContributors from '@/hook/use-get-contributors';
import useGetLastIssues from '@/hook/use-get-last-issues';
import useGetMilestone from '@/hook/use-get-milestone';
import useGetNewContributors from '@/hook/use-get-new-contributors';

import { getLastMRs, TimeFilter } from '@/util/github';

import REPOSITORY from '@/constant/repository';
import VIDEOS from '@/constant/videos';

import HeaderImage from '@/image/header.png';

import Scoreboard from '@/components/features/scoreboard/scoreboard';

const ScoreboardPage = () => {
  const { data: allTimeContributors, isPending: isAllTimePending } = useGetContributors({
    timeFilter: TimeFilter.ALL_TIME,
  });

  const { data: milestone } = useGetMilestone();
  const { data: issues, isPending: isIssuesPending } = useGetLastIssues();
  const { data: newContributors, isPending: isNewContributorsPending } = useGetNewContributors();

  const lastMRs = useMemo(() => getLastMRs(allTimeContributors ?? [], 5), [allTimeContributors]);

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
        <NextLink href="/milestone">
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
