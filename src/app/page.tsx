import { Metadata } from 'next';
import Image from 'next/image';
import NextLink from 'next/link';

import { Flex, Grid, Heading, ScrollArea, Text } from '@radix-ui/themes';

import MilestoneProgress from '@/feature/milestone-progress';
import Scoreboard from '@/feature/scoreboard';

import Footer from '@/module/footer';
import IssuesTable from '@/module/issues-table';
import UserTable from '@/module/user-table';

import YoutubeEmbeddedVideo from '@/element/youtube-embedded-video';

import { getCachedContributors } from '@/util/contributors';
import {
  getLastIssuesWithLabel,
  getLastMRs,
  getNewContributors,
  getTimeFilterFromSearchParam,
  TimeFilter,
} from '@/util/github';
import { getMilestone } from '@/util/milestones';
import { getContributorsWithScore } from '@/util/score';

import MILESTONE from '@/constant/milestone';
import REPOSITORY from '@/constant/repository';

import HeaderImage from '@/image/header.png';

export const metadata: Metadata = {
  title: 'Top of Gnome',
};

export interface HomePageParams {
  searchParams: {
    f?: string | string[] | undefined;
  };
}

const HomePage = async ({ searchParams: { f } }: HomePageParams) => {
  const timeFilter = getTimeFilterFromSearchParam(f, TimeFilter.MONTHLY);

  const allTimeCachedContributors = await getCachedContributors(TimeFilter.ALL_TIME);
  const cachedContributors = await getCachedContributors(timeFilter);

  const milestone = await getMilestone(MILESTONE.number);

  const filteredContributors = getContributorsWithScore(cachedContributors).filter(({ score }) => score);

  const lastMRs = getLastMRs(allTimeCachedContributors, 5);
  const lastIssues = getLastIssuesWithLabel(allTimeCachedContributors, ['good first issue', 'help wanted'], 5);
  const newContributors = getNewContributors(allTimeCachedContributors, 5);

  return (
    <Flex className="h-screen w-screen" asChild>
      <ScrollArea>
        <Flex
          p={{ initial: '2', sm: '4', lg: '7' }}
          gap="2"
          direction="column"
          className="max-w-screen mx-auto w-full min-w-0 max-w-7xl overflow-hidden"
        >
          <Image src={HeaderImage} alt="Header Image" className="rounded-3" />

          {milestone && (
            <NextLink href="/milestone">
              <MilestoneProgress milestone={milestone} />
            </NextLink>
          )}

          <Grid columns="3" rows="auto auto" gap="4">
            <Text weight="bold" size="6" mt="6" asChild>
              <NextLink href={`https://github.com/${REPOSITORY.owner}/${REPOSITORY.repository}/issues`} target="_blank">
                👋 Help Wanted!
              </NextLink>
            </Text>

            <Text weight="bold" size="6" mt="6">
              ✔️ Freshly Merged
            </Text>

            <Text weight="bold" size="6" mt="6">
              ⭐ New Rising gnome
            </Text>

            <IssuesTable issues={lastIssues} showLabels="on-hover" />
            <IssuesTable issues={lastMRs} />
            <UserTable users={newContributors} />
          </Grid>

          <Heading size="6" mt="6" className="text-center">
            🏅 Gnolove Scoreboard
          </Heading>

          <Scoreboard contributors={filteredContributors} timeFilter={timeFilter} />

          <Text weight="bold" size="6" mt="6">
            🎥 Latest gnoland videos
          </Text>

          <Grid columns={{ initial: '1', xs: '2', md: '3'}} rows="auto" gap="2">
            <YoutubeEmbeddedVideo
              className="overflow-hidden rounded-4"
              src="https://www.youtube.com/embed/-io_Fu7qKrs?si=EjpiUa-fffFmslZx"
            />

            <YoutubeEmbeddedVideo
              className="overflow-hidden rounded-4"
              src="https://www.youtube.com/embed/b3zRbVcJxyE?si=XFl4uW9yt5pj7eYU"
            />

            <YoutubeEmbeddedVideo
              className="overflow-hidden rounded-4"
              src="https://www.youtube.com/embed/3czMK3s30KQ?si=Uu9zTyhRNYABOEni"
            />

            <YoutubeEmbeddedVideo
              className="overflow-hidden rounded-4"
              src="https://www.youtube.com/embed/4YUOTt5bDJc?si=VLT1lD9vT4pO2Kt5"
            />

            <YoutubeEmbeddedVideo
              className="overflow-hidden rounded-4"
              src="https://www.youtube.com/embed/ZI0ZGDMbj-U?si=Eu01gxNcbY69y6QU"
            />

            <YoutubeEmbeddedVideo
              className="overflow-hidden rounded-4"
              src="https://www.youtube.com/embed/hTGeG0z09NU?si=Mx4To7XyyJF1rQm2"
            />
          </Grid>
        </Flex>

        <Footer />
      </ScrollArea>
    </Flex>
  );
};

export default HomePage;
