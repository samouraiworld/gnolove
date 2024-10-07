import { Metadata } from 'next';
import Image from 'next/image';

import { Flex, Grid, Heading, ScrollArea } from '@radix-ui/themes';

import Scoreboard from '@/feature/scoreboard';

import Footer from '@/module/footer';
import IssuesTable from '@/module/issues-table';
import UserTable from '@/module/user-table';

import { getCachedContributorsQuery } from '@/util/contributors';
import {
  getLastIssuesWithLabel,
  getLastMRs,
  getNewContributors,
  getTimeFilterFromSearchParam,
  TimeFilter,
} from '@/util/github';

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

  const allTimeQuery = getCachedContributorsQuery(TimeFilter.ALL_TIME);
  const query = getCachedContributorsQuery(timeFilter);

  const allTimeCachedContributors = await allTimeQuery();
  const cachedContributors = await query();

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
          className="max-w-screen mx-auto w-full min-w-0 max-w-5xl overflow-hidden"
        >
          <Image src={HeaderImage} alt="Header Image" className="rounded-3" />

          <Grid columns="3" rows="auto auto" gap="4">
            <Heading size="6" mt="6">
              👋 Help Wanted!
            </Heading>

            <Heading size="6" mt="6">
              ✔️ Freshly Merged
            </Heading>

            <Heading size="6" mt="6">
              ⭐ New Rising gnome
            </Heading>

            <IssuesTable issues={lastIssues} />
            <IssuesTable issues={lastMRs} />
            <UserTable users={newContributors} />
          </Grid>

          <Heading size="6" mt="6" className="text-center">
            🏅 Gnolove Scoreboard
          </Heading>

          <Scoreboard contributors={cachedContributors} timeFilter={timeFilter} />
        </Flex>

        <Footer />
      </ScrollArea>
    </Flex>
  );
};

export default HomePage;
