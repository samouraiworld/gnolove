import { unstable_cache } from 'next/cache';

import graphql from '@/instance/graphql';

import { getUsersWithStats, TimeFilter } from '@/util/github';

import contributors from '@/constant/contributors';
import REPOSITORY from '@/constant/repository';

import { UserWithStats } from '@/type/github';

export const getCachedContributorsQuery = (timeFilter: TimeFilter) =>
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

export const getCachedContributorsFromTimeFilter = async (timeFilter: TimeFilter) => {
  return getCachedContributorsQuery(timeFilter)();
};
