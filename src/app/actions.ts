'use server';

import { z } from 'zod';

import { TimeFilter } from '@/utils/github';
import {
  ContributorSchema,
  EnhancedUserWithStatsSchema,
  IssueSchema,
  MilestoneSchema,
  NamespacesSchema,
  PackagesSchema,
  RepositorySchema,
  ScoreFactorsSchema,
  UserSchema,
} from '@/utils/schemas';

import MILESTONE from '@/constants/milestone';
import TEAMS from '@/constants/teams';

import ENV from '@/env';

export const getContributors = async (timeFilter: TimeFilter, excludeCoreTeam?: boolean, repositories?: string[]) => {
  const url = new URL('/getStats', ENV.NEXT_PUBLIC_API_URL);

  if (timeFilter !== 'all') url.searchParams.set('time', timeFilter);

  if (excludeCoreTeam) {
    const coreTeam = TEAMS.find((team) => team.name === 'Core Team');
    if (coreTeam) for (const login of coreTeam.members) url.searchParams.append('exclude', login);
  }

  if (repositories) url.searchParams.append('repositories', repositories.join(','));

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

export const getContributor = async (login: string) => {
  const url = new URL(`/contributors/${login}`, ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to fetch contributor ${login}: ${res.status}`);
  }
  const data = await res.json();

  return ContributorSchema.parse(data);
};

export const getPackages = async () => {
  const url = new URL('/onchain/packages', ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return PackagesSchema.parse(data);
};

export const getPackagesByUser = async (address: string) => {
  if (!address) return [];
  const url = new URL(`/onchain/packages/${address}`, ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return PackagesSchema.parse(data);
};

export const getNamespaces = async () => {
  const url = new URL('/onchain/namespaces', ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return NamespacesSchema.parse(data);
};

export const getNamespacesByUser = async (address: string) => {
  const url = new URL(`/onchain/namespaces/${address}`, ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return NamespacesSchema.parse(data);
};

export const getScoreFactors = async () => {
  const url = new URL('/score-factors', ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return ScoreFactorsSchema.parse(data);
};