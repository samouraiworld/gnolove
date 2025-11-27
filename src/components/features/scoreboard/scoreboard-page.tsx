'use client';

import { useMemo } from 'react';

import NextLink from 'next/link';

import { Box, Flex, Grid, Heading, Text } from '@radix-ui/themes';

import MilestoneProgress from '@/features/milestone-progress';

import IssuesTable from '@/modules/issues-table';
import PrsTable from '@/modules/prs-table';
import UserTable from '@/modules/user-table';

import YoutubeEmbeddedVideo from '@/elements/youtube-embedded-video';

import useGetContributors from '@/hooks/use-get-contributors';
import useGetLastIssues from '@/hooks/use-get-last-issues';
import useGetMilestone from '@/hooks/use-get-milestone';
import useGetNewContributors from '@/hooks/use-get-new-contributors';

import { getLastPRs, TimeFilter } from '@/utils/github';

import REPOSITORY from '@/constants/repository';

import Scoreboard from '@/features/scoreboard/scoreboard';
import { useOffline } from '@/contexts/offline-context';
import { cn } from '@/utils/style';
import Loader from '@/elements/loader';
import { TYoutubeVideoPlaylist } from '@/utils/schemas';
import Image from 'next/image';

const ScoreboardPage = ({ videos }: { videos?: TYoutubeVideoPlaylist }) => {
  const { data: allTimeContributors, isPending: isAllTimePending } = useGetContributors({
    timeFilter: TimeFilter.ALL_TIME,
  });

  const { data: milestone } = useGetMilestone();
  const { data: issues, isPending: isIssuesPending } = useGetLastIssues();
  const { data: newContributors, isPending: isNewContributorsPending } = useGetNewContributors();

  const lastPRs = useMemo(() => getLastPRs(allTimeContributors?.users ?? [], 5), [allTimeContributors]);

  const { isOffline } = useOffline();

  return (
    <Flex gap="4" direction="column">
      <Box my="4">
        {/* <video
          className="motion-reduce:hidden h-full min-h-[200px] w-full object-cover rounded-4"
          autoPlay
          loop
          muted
          playsInline
          poster='/images/header.png'
          preload='none'
        >
          <source src="/videos/gnolove_drone-on-the-desk-video.mp4" type="video/mp4" />
        </video> */}
        <Image
          alt="Gnolove"
          src="/images/header.png"
          className="h-full min-h-[200px] w-full object-cover rounded-4"
          width={1920}
          height={1000}
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
          {isIssuesPending ? <Loader /> : <IssuesTable issues={issues ?? []} showLabels="on-hover" />}
        </Flex>

        <Flex direction="column" gap="4">
          <Heading as="h2" weight="bold" size="6" mt="6">
            ✔️ Freshly Merged
          </Heading>
          {isAllTimePending ? <Loader /> : <PrsTable prs={lastPRs} />}
        </Flex>

        <Flex direction="column" gap="4">
          <Heading as="h2" weight="bold" size="6" mt="6">
            ⭐ New Rising gnome
          </Heading>
          {isNewContributorsPending ? <Loader /> : <UserTable users={newContributors ?? []} />}
        </Flex>
      </Grid>

      <Flex justify="center" align="center" mt="6">
        <Heading size="6" className="text-center">
          🏅 Gnolove Scoreboard
        </Heading>
      </Flex>

      <Scoreboard />

      {videos && videos.items.length > 0 && (
        <>
          <Text weight="bold" size="6" mt="6">
            🎥 Latest gnoland videos
          </Text>

          <Grid columns={{ initial: '1', xs: '2', md: '3' }} rows="auto" gap="2">
            {videos.items.map((video: { snippet: { resourceId: { videoId: string } } }) => (
              <YoutubeEmbeddedVideo
                key={video.snippet.resourceId.videoId}
                className="overflow-hidden rounded-4"
                id={video.snippet.resourceId.videoId}
              />
            ))}
          </Grid>
        </>
      )}
    </Flex>
  );
};

export default ScoreboardPage;
