import CacheRepository from '@/class/cache-repository';

import graphql from '@/instance/graphql';

import { getUsersWithStats, TimeFilter } from '@/util/github';

import contributors from '@/constant/contributors';
import REPOSITORY from '@/constant/repository';

import { UserWithStats } from '@/type/github';

const EXPIRES_AFTER = 1000 * 60 * 60; // expires after 1 hour

const fetchAndSetCache = async (timeFilter: TimeFilter) => {
  const usersWithStats = await getUsersWithStats(graphql, REPOSITORY, timeFilter);
  await CacheRepository.setContributors(timeFilter, usersWithStats);

  return usersWithStats;
};

export const getCachedContributors = async (timeFilter: TimeFilter): Promise<UserWithStats[]> => {
  const data = await CacheRepository.getContributors(timeFilter);

  if (!data) {
    try {
      return await fetchAndSetCache(timeFilter);
    } catch (err) {
      console.error(err);

      // eslint-disable-next-line
      console.log('Failed to retrieve the contributors. Using the fallback file.');
      return contributors[timeFilter];
    }
  }

  const msSinceLastUpdate = Date.now() - data.lastUpdate;
  if (msSinceLastUpdate < EXPIRES_AFTER) return data.usersWithStats;

  try {
    return await fetchAndSetCache(timeFilter);
  } catch (err) {
    console.error(err);

    // eslint-disable-next-line
    console.log('Failed to retrieve the contributors. Using the cached values file.');
    return data.usersWithStats;
  }
};
