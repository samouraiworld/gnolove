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
  PullRequestReportSchema,
  RepositorySchema,
  ScoreFactorsSchema,
  UserSchema,
  YoutubePlaylistIdSchema,
  YoutubeVideoPlaylistSchema,
} from '@/utils/schemas';

import MILESTONE from '@/constants/milestone';
import TEAMS from '@/constants/teams';

import ENV from '@/env';

export const getContributors = async (timeFilter: TimeFilter, excludeCoreTeam?: boolean, repositories?: string[]) => {
  const url = new URL('/stats', ENV.NEXT_PUBLIC_API_URL);

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
  const url = new URL('/issues?labels=help wanted,bounty', ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return z.array(IssueSchema).parse(data).slice(0, last);
};

export const getPullrequestsReportByDate = async (startDate: Date, endDate: Date) => {
  const url = new URL('/pull-requests/report', ENV.NEXT_PUBLIC_API_URL);

  url.searchParams.set('startdate', startDate.toISOString());
  url.searchParams.set('enddate', endDate.toISOString());

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to fetch pull requests report: ${res.status}`);
  }
  const data = await res.json();

  return PullRequestReportSchema.parse(data);
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
  const url = new URL('/repositories', ENV.NEXT_PUBLIC_API_URL);

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

export const getYoutubeChannelUploadsPlaylistId = async (searchParams: { channelId?: string; channelUsername?: string }) => {
  if (!ENV.YOUTUBE_API_KEY) {
    console.error('YouTube API key is not configured.');
    return '';
  }

  const { channelId, channelUsername } = searchParams || {};

  // Validate inputs: at least one of channelId or channelUsername is required
  if (!channelId && !channelUsername) {
    console.error('Validation error: either channelId or channelUsername must be provided.');
    return '';
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/channels');

  url.searchParams.set('part', 'contentDetails');

  if (channelId) url.searchParams.set('id', channelId);
  if (channelUsername) url.searchParams.set('forUsername', channelUsername);

  url.searchParams.set('key', ENV.YOUTUBE_API_KEY);

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });

  // Check HTTP response
  if (!res.ok) {
    const bodyText = await res.text();
    console.error(
      `YouTube API error: ${res.status} ${res.statusText}${bodyText ? ` - ${bodyText}` : ''}`
    );
    return '';
  }

  const data = await res.json();

  const uploads = data.items[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) {
    console.error('Channel found but uploads playlist ID is missing in response.');
    return '';
  }

  return YoutubePlaylistIdSchema.parse(uploads);
};

export const getYoutubePlaylistVideos = async (playlistId: string, maxResults: number = 50) => {
  if (!ENV.YOUTUBE_API_KEY) {
    console.error('YouTube API key is not configured.');
    return [];
  }
  // Clamp maxResults to YouTube API allowed range [1..50]
  const clampedMax = z.number().int().min(1).max(50).catch(50).parse(maxResults);

  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');

  url.searchParams.set('part', 'snippet');
  url.searchParams.set('playlistId', playlistId);
  url.searchParams.set('maxResults', clampedMax.toString());
  url.searchParams.set('key', ENV.YOUTUBE_API_KEY);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });

  // Check HTTP response early and include body text if available
  if (!res.ok) {
    const bodyText = await res.text();
    console.error(`YouTube API error (playlistItems): ${res.status} ${res.statusText}${bodyText ? ` - ${bodyText}` : ''}`);
    return [];
  }

  const data = await res.json();

  // Ensure data and items exist
  if (!data || !Array.isArray(data.items)) {
    const apiErrorMessage = data?.error?.message || data?.message;
    console.error(`Invalid YouTube response: items missing or not an array${apiErrorMessage ? ` - ${apiErrorMessage}` : ''}`);
    return [];
  }

  if (data.items.length === 0) {
    console.error('Playlist not found / Playlist items not found');
    return [];
  }

  return YoutubeVideoPlaylistSchema.parse(data.items);
};