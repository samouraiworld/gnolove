import { Metadata } from 'next';
import Image from 'next/image';
import NextLink from 'next/link';

import { Grid, Heading, Text } from '@radix-ui/themes';
import { z } from 'zod';

import MilestoneProgress from '@/feature/milestone-progress';
import Scoreboard from '@/feature/scoreboard';

import LayoutContainer from '@/layout/layout-container';

import IssuesTable from '@/module/issues-table';
import PrsTable from '@/module/prs-table';
import UserTable from '@/module/user-table';

import YoutubeEmbeddedVideo from '@/element/youtube-embedded-video';

import { getLastMRs, getTimeFilterFromSearchParam, TimeFilter } from '@/util/github';
import { EnhancedUserWithStatsSchema, IssueSchema, MilestoneSchema, UserSchema } from '@/util/schemas';
import { getContributorsWithScore } from '@/util/score';

import MILESTONE from '@/constant/milestone';
import REPOSITORY from '@/constant/repository';
import teams from '@/constant/teams';

import HeaderImage from '@/image/header.png';

import ENV from '@/env';

export const metadata: Metadata = {
  title: 'Top of Gnome',
};

export interface HomePageParams {
  searchParams: {
    f?: string | string[] | undefined;
    e?: string | string[] | undefined;
  };
}

const getParameterFromTimeFilter = (timeFilter: TimeFilter) => {
  switch (timeFilter) {
    case TimeFilter.MONTHLY:
      return 'monthly';
    case TimeFilter.WEEKLY:
      return 'weekly';
    case TimeFilter.ALL_TIME:
      return 'all';
    default:
      return 'all';
  }
};

const getContributors = async (timeFilter: TimeFilter, exclude?: string[]) => {
  const url = new URL('/getStats', ENV.NEXT_PUBLIC_API_URL);

  const timeParameter = getParameterFromTimeFilter(timeFilter);
  if (timeParameter !== 'all') url.searchParams.set('time', timeParameter);

  if (exclude) for (const login of exclude) url.searchParams.append('exclude', login);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return z.array(EnhancedUserWithStatsSchema).parse(data);
};

const getLastIssues = async (last: number) => {
  const url = new URL('/getIssues?labels=help wanted,bounty', ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return z.array(IssueSchema).parse(data).slice(0, last);
};

const getNewContributors = async () => {
  const url = new URL('/contributors/newest?number=5', ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return z.array(UserSchema).parse(data);
};

const getMilestone = async () => {
  const url = new URL(`/milestones/${MILESTONE.number}`, ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return MilestoneSchema.parse(data);
};

const coreTeam = teams.find(({ name }) => name === 'Core Team');

const HomePage = async ({ searchParams: { f, e } }: HomePageParams) => {
  const timeFilter = getTimeFilterFromSearchParam(f, TimeFilter.MONTHLY);

  const exclude = !!e && coreTeam ? coreTeam.members : undefined;

  const allTimeCachedContributors = await getContributors(TimeFilter.ALL_TIME);

  const contributors = await getContributors(timeFilter, exclude);
  const issues = await getLastIssues(5);
  const newContributors = await getNewContributors();
  const milestone = await getMilestone();

  const filteredContributors = getContributorsWithScore(contributors).filter(({ score }) => score);

  const lastMRs = getLastMRs(allTimeCachedContributors, 5);

  return (
    <LayoutContainer>
      <Image src={HeaderImage} alt="Header Image" className="rounded-3" />

      {milestone && (
        <NextLink href="/milestone">
          <MilestoneProgress milestone={milestone} />
        </NextLink>
      )}

      <Grid columns="3" rows="auto auto" gap="4">
        <Text weight="bold" size="6" mt="6" asChild>
          <NextLink
            href={`https://github.com/${REPOSITORY.owner}/${REPOSITORY.repository}/labels/help%20wanted`}
            target="_blank"
          >
            👋 Help Wanted!
          </NextLink>
        </Text>

        <Text weight="bold" size="6" mt="6">
          ✔️ Freshly Merged
        </Text>

        <Text weight="bold" size="6" mt="6">
          ⭐ New Rising gnome
        </Text>

        <IssuesTable issues={issues} showLabels="on-hover" />
        <PrsTable prs={lastMRs} />
        <UserTable users={newContributors} />
      </Grid>

      <Heading size="6" mt="6" className="text-center">
        🏅 Gnolove Scoreboard
      </Heading>

      <Scoreboard contributors={filteredContributors} excludeCoreTeam={!!e} timeFilter={timeFilter} />

      <Text weight="bold" size="6" mt="6">
        🎥 Latest gnoland videos
      </Text>

      <Grid columns={{ initial: '1', xs: '2', md: '3' }} rows="auto" gap="2">
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
    </LayoutContainer>
  );
};

export default HomePage;
