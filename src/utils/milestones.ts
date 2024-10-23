import CacheRepository from '@/class/cache-repository';

import octokit from '@/instance/octokit';

import { getMilestone } from '@/util/github';

import MILESTONE from '@/constant/milestone';
import REPOSITORY from '@/constant/repository';

const EXPIRES_AFTER = 1000 * 60 * 60 * 6; // expires after 6 hour

const fetchAndSetCache = async () => {
  const milestone = await getMilestone(octokit, REPOSITORY, MILESTONE.number);
  await CacheRepository.setMilestone(MILESTONE.number, milestone);

  return milestone;
};

export const getCachedMilestone = async () => {
  const data = await CacheRepository.getMilestone(MILESTONE.number);

  if (!data) return await fetchAndSetCache();

  const msSinceLastUpdate = Date.now() - data.lastUpdate;
  if (msSinceLastUpdate < EXPIRES_AFTER) return data.milestone;

  return await fetchAndSetCache();
};
