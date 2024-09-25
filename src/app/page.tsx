import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import Image from 'next/image';

import { Flex, Heading, ScrollArea } from '@radix-ui/themes';

import Scoreboard from '@/feature/scoreboard';

import ContributorTable from '@/module/contributor-table';
import IssuesTable from '@/module/issues-table';

import graphql from '@/instance/graphql';

import {
  getNewContributors,
  getLastIssuesWithLabel,
  getTimeFilterFromSearchParam,
  getUsersWithStats,
  TimeFilter,
} from '@/util/github';

import contributors from '@/constant/contributors';
import REPOSITORY from '@/constant/repository';

import { UserWithStats } from '@/type/github';

import HeaderImage from '@/image/header.png';

export const metadata: Metadata = {
  title: 'Top of Gnome',
};

const getCachedContributorsQuery = (timeFilter: TimeFilter) =>
  unstable_cache(
    async (): Promise<UserWithStats[]> => {
      // ! The request takes time to load. Only use the dynamic feature in the production environment to avoid slow
      // ! development process.
      if (process.env.NODE_ENV !== 'production') return contributors[timeFilter];

      try {
        // ! Keep the 'await' otherwise, the try-catch block is not triggered.
        return await getUsersWithStats(graphql, REPOSITORY, timeFilter);
      } catch (err) {
        console.error(err);

        // eslint-disable-next-line
        console.log('Failed to retrieve the contributors. Using the fallback file.');
        return contributors[timeFilter];
      }
    },
    ['contributors', timeFilter],
    { revalidate: 60 * 60 }, // 60 * 60 = 3600 secs = 1 hour
  );

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

          <Heading size="6" mt="6">
            Help Wanted !
          </Heading>

          <IssuesTable issues={lastIssues} className="w-full" />

          <Heading size="6" mt="6">
            New Rising Contributors
          </Heading>

          <ContributorTable contributors={newContributors} />

          <Heading size="6" mt="6">
            Scoreboard
          </Heading>

          <Scoreboard contributors={cachedContributors} timeFilter={timeFilter} />
        </Flex>
      </ScrollArea>
    </Flex>
  );
};

export default HomePage;
