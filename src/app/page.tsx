import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';

import { Flex, ScrollArea } from '@radix-ui/themes';

import Scoreboard from '@/feature/scoreboard';

import graphql from '@/instance/graphql';

import { getTimeFilterFromSearchParam, getUsersWithStats, TimeFilter } from '@/util/github';

import contributors from '@/constant/contributors';
import REPOSITORY from '@/constant/repository';

import { UserWithStats } from '@/type/github';

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
  const query = getCachedContributorsQuery(timeFilter);

  const cachedContributors = await query();

  return (
    <Flex className="h-screen w-screen" asChild>
      <ScrollArea>
        <Scoreboard contributors={cachedContributors} timeFilter={timeFilter} className="mx-auto w-full max-w-5xl" />
      </ScrollArea>
    </Flex>
  );
};

export default HomePage;
