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

  // eslint-disable-next-line
  console.log(`Setting the cache for contributors and time filter : '${timeFilter}'.`);

  return usersWithStats;
};

export const getCachedContributors = async (timeFilter: TimeFilter): Promise<UserWithStats[]> => {
  // eslint-disable-next-line
  console.log('==============================');

  const data = await CacheRepository.getContributors(timeFilter);

  if (!data) {
    // eslint-disable-next-line
    console.log('No cached contributors found.');

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

  // eslint-disable-next-line
  console.log(
    'Timestamp :',
    data.lastUpdate,
    ' | ',
    'Secs since last update :',
    msSinceLastUpdate / 1000,
    'secs | Expires after :',
    EXPIRES_AFTER / 1000,
    'secs',
  );

  if (msSinceLastUpdate < EXPIRES_AFTER) {
    // eslint-disable-next-line
    console.log('Using the cached contributors.');

    return data.usersWithStats;
  }

  try {
    return await fetchAndSetCache(timeFilter);
  } catch (err) {
    console.error(err);

    // eslint-disable-next-line
    console.log('Failed to retrieve the contributors. Using the cached values file.');
    return data.usersWithStats;
  }
};
