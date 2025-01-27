'use server';

import { z } from 'zod';

import { TimeFilter } from '@/util/github';
import { getParameterFromTimeFilter } from '@/util/repositories';
import {
  EnhancedUserWithStatsSchema,
  IssueSchema,
  MilestoneSchema,
  RepositorySchema,
  UserSchema,
} from '@/util/schemas';

import MILESTONE from '@/constant/milestone';
import TEAMS from '@/constant/teams';

import ENV from '@/env';

export const getContributors = async (timeFilter: TimeFilter, excludeCoreTeam?: boolean, repositories?: string[]) => {
  const url = new URL('/getStats', ENV.NEXT_PUBLIC_API_URL);

  const timeParameter = getParameterFromTimeFilter(timeFilter);
  if (timeParameter !== 'all') url.searchParams.set('time', timeParameter);

  if (excludeCoreTeam) {
    const coreTeam = TEAMS.find((team) => team.name === 'Core Team');
    if (coreTeam) for (const login of coreTeam.members) url.searchParams.append('exclude', login);
  }

  if (repositories) for (const repository of repositories) url.searchParams.append('repositories', repository);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return z.array(EnhancedUserWithStatsSchema).parse(data);
};

export const getLastIssues = async (last: number) => {
  const url = new URL('/getIssues?labels=help wanted,bounty', ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return z.array(IssueSchema).parse(data).slice(0, last);
};

export const getNewContributors = async () => {
  const url = new URL('/contributors/newest?number=5', ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return z.array(UserSchema).parse(data);
};

export const getMilestone = async () => {
  const url = new URL(`/milestones/${MILESTONE.number}`, ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return MilestoneSchema.parse(data);
};

export const getRepositories = async () => {
  const url = new URL('/getRepositories', ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return z.array(RepositorySchema).parse(data);
};
