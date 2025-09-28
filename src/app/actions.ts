'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { fetchJson, HttpError } from '@/utils/fetcher';
import { TimeFilter } from '@/utils/github';
import {
  BlockHeightSchema,
  ContributorSchema,
  EnhancedUserWithStatsSchema,
  IssueSchema,
  MilestoneSchema,
  NamespacesSchema,
  PackagesSchema,
  ProposalSchema,
  ProposalsSchema,
  GovdaoMembersSchema,
  PullRequestReportSchema,
  ReportHourSchema,
  RepositorySchema,
  ScoreFactorsSchema,
  TYoutubeVideoPlaylist,
  UserBaseSchema,
  UserSchema,
  ValidatorLastIncidentsSchema,
  ValidatorsParticipationSchema,
  YoutubePlaylistIdSchema,
  YoutubeVideoPlaylistSchema,
} from '@/utils/schemas';
import { EValidatorPeriod } from '@/utils/validators';

import MILESTONE from '@/constants/milestone';
import TEAMS from '@/constants/teams';

import ENV from '@/env';
import { MonitoringWebhookSchema, TMonitoringWebhook, TMonitoringWebhookKind } from '@/utils/schemas';
import { auth } from '@clerk/nextjs/server';

export const getContributors = async (timeFilter: TimeFilter, excludeCoreTeam?: boolean, repositories?: string[]) => {
  const url = new URL('/stats', ENV.NEXT_PUBLIC_API_URL);

  if (timeFilter !== 'all') url.searchParams.set('time', timeFilter);

  if (excludeCoreTeam) {
    const coreTeam = TEAMS.find((team) => team.name === 'Core Team');
    if (coreTeam) for (const login of coreTeam.members) url.searchParams.append('exclude', login);
  }

  if (repositories) url.searchParams.append('repositories', repositories.join(','));

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return z.array(EnhancedUserWithStatsSchema).parse(data);
};

// Monitoring webhooks (GOVDAO, VALIDATOR)
export const listMonitoringWebhooks = async (kind: TMonitoringWebhookKind): Promise<TMonitoringWebhook[]> => {
  if (!ENV.NEXT_PUBLIC_MONITORING_API_URL) throw new Error('Monitoring API base URL is not configured');
  const { getToken } = auth();
  const token = await getToken();
  if (!token) throw new Error('Authentication required');
  const url = new URL(`/webhooks/${kind}`, ENV.NEXT_PUBLIC_MONITORING_API_URL);
  const data = await fetchJson(url.toString(), { cache: 'no-cache', headers: { Authorization: `Bearer ${token}` } });
  return MonitoringWebhookSchema.array().parse(data);
};

export const createMonitoringWebhook = async (
  kind: TMonitoringWebhookKind,
  payload: Omit<TMonitoringWebhook, 'ID'>,
): Promise<void> => {
  if (!ENV.NEXT_PUBLIC_MONITORING_API_URL) throw new Error('Monitoring API base URL is not configured');
  const { getToken } = auth();
  const token = await getToken();
  if (!token) throw new Error('Authentication required');
  const url = new URL(`/webhooks/${kind}`, ENV.NEXT_PUBLIC_MONITORING_API_URL);
  const body = MonitoringWebhookSchema.omit({ ID: true }).parse(payload);
  const res = await fetch(url.toString(), { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new HttpError(`Request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`, { status: res.status, statusText: res.statusText, bodyText: text });
  }
  revalidatePath('/settings');
};

export const updateMonitoringWebhook = async (
  kind: TMonitoringWebhookKind,
  payload: TMonitoringWebhook,
): Promise<void> => {
  if (!ENV.NEXT_PUBLIC_MONITORING_API_URL) throw new Error('Monitoring API base URL is not configured');
  const { getToken } = auth();
  const token = await getToken();
  if (!token) throw new Error('Authentication required');
  const url = new URL(`/webhooks/${kind}`, ENV.NEXT_PUBLIC_MONITORING_API_URL);
  if (payload.ID == null) throw new Error('ID is required for updates');
  const body = MonitoringWebhookSchema.parse(payload);
  const res = await fetch(url.toString(), { method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new HttpError(`Request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`, { status: res.status, statusText: res.statusText, bodyText: text });
  }
  revalidatePath('/settings');
};

export const deleteMonitoringWebhook = async (
  kind: TMonitoringWebhookKind,
  id: number,
): Promise<void> => {
  if (!ENV.NEXT_PUBLIC_MONITORING_API_URL) throw new Error('Monitoring API base URL is not configured');
  const { getToken } = auth();
  const token = await getToken();
  if (!token) throw new Error('Authentication required');
  const url = new URL(`/webhooks/${kind}?id=${encodeURIComponent(String(id))}`, ENV.NEXT_PUBLIC_MONITORING_API_URL);
  const res = await fetch(url.toString(), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new HttpError(`Request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`, { status: res.status, statusText: res.statusText, bodyText: text });
  }
  revalidatePath('/settings');
};

export const getReportHour = async () => {
  if (!ENV.NEXT_PUBLIC_MONITORING_API_URL) throw new Error('Monitoring API base URL is not configured');
  const { getToken } = auth();
  const token = await getToken();
  if (!token) throw new Error('Authentication required');
  const url = new URL('/usersH', ENV.NEXT_PUBLIC_MONITORING_API_URL);

  const data = await fetchJson(url.toString(), { cache: 'no-cache', headers: { Authorization: `Bearer ${token}` } });
  if (!data) return ReportHourSchema.parse({ DailyReportHour: 9, DailyReportMinute: 0, Timezone: 'Europe/Paris' });
  return ReportHourSchema.parse(data);
};

export const updateReportHour = async (payload: { hour: number; minute: number; timezone: string }) => {
  if (!ENV.NEXT_PUBLIC_MONITORING_API_URL) throw new Error('Monitoring API base URL is not configured');
  const { getToken } = auth();
  const token = await getToken();
  if (!token) throw new Error('Authentication required');
  const url = new URL('/usersH', ENV.NEXT_PUBLIC_MONITORING_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache', method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new HttpError(`Request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`, { status: res.status, statusText: res.statusText, bodyText: text });
  }
  revalidatePath('/settings');
};

export const getLastIssues = async (last: number) => {
  const url = new URL('/issues?labels=help wanted,bounty', ENV.NEXT_PUBLIC_API_URL);

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return z.array(IssueSchema).parse(data).slice(0, last);
};

export const getPullrequestsReportByDate = async (startDate: Date, endDate: Date) => {
  const url = new URL('/pull-requests/report', ENV.NEXT_PUBLIC_API_URL);

  url.searchParams.set('startdate', startDate.toISOString());
  url.searchParams.set('enddate', endDate.toISOString());

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return PullRequestReportSchema.parse(data);
};

export const getNewContributors = async () => {
  const url = new URL('/contributors/newest?number=5', ENV.NEXT_PUBLIC_API_URL);

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return z.array(UserSchema).parse(data);
};

export const getMilestone = async () => {
  const url = new URL(`/milestones/${MILESTONE.number}`, ENV.NEXT_PUBLIC_API_URL);

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return MilestoneSchema.parse(data);
};

export const getRepositories = async () => {
  const url = new URL('/repositories', ENV.NEXT_PUBLIC_API_URL);

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return z.array(RepositorySchema).parse(data);
};

export const getContributor = async (login: string) => {
  const url = new URL(`/contributors/${login}`, ENV.NEXT_PUBLIC_API_URL);

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return ContributorSchema.parse(data);
};

export const getPackages = async () => {
  const url = new URL('/onchain/packages', ENV.NEXT_PUBLIC_API_URL);

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return PackagesSchema.parse(data);
};

export const getPackagesByUser = async (address: string) => {
  if (!address) return [];
  const url = new URL(`/onchain/packages/${address}`, ENV.NEXT_PUBLIC_API_URL);

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return PackagesSchema.parse(data);
};

export const getNamespaces = async () => {
  const url = new URL('/onchain/namespaces', ENV.NEXT_PUBLIC_API_URL);

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return NamespacesSchema.parse(data);
};

export const getNamespacesByUser = async (address: string) => {
  const url = new URL(`/onchain/namespaces/${address}`, ENV.NEXT_PUBLIC_API_URL);

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return NamespacesSchema.parse(data);
};

// On-chain proposals
export const getProposals = async (address?: string) => {
  const url = new URL('/onchain/proposals', ENV.NEXT_PUBLIC_API_URL);
  if (address) url.searchParams.set('address', address);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return ProposalsSchema.parse(data);
};

// On-chain Gov dao members
export const getGovdaoMembers = async () => {
  const url = new URL('/onchain/govdao-members', ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return GovdaoMembersSchema.parse(data);
};

export const getProposalsByUser = async (address: string) => {
  if (!address) return [];
  return getProposals(address);
};

export const getProposal = async (id: string) => {
  if (!id) throw new HttpError('Proposal id is required', { status: 400, statusText: 'Bad Request' });
  const url = new URL(`/onchain/proposals/${id}`, ENV.NEXT_PUBLIC_API_URL);

  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  if (data.error) throw new HttpError(data.error, { status: 404, statusText: data.error });
  return ProposalSchema.parse(data);
};

export const getScoreFactors = async () => {
  const url = new URL('/score-factors', ENV.NEXT_PUBLIC_API_URL);

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return ScoreFactorsSchema.parse(data);
};

export const getYoutubeChannelUploadsPlaylistId = async (searchParams: {
  channelId?: string;
  channelUsername?: string;
}) => {
  if (!ENV.YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured.');
  }

  const { channelId, channelUsername } = searchParams || {};

  // Validate inputs: at least one of channelId or channelUsername is required
  if (!channelId && !channelUsername) {
    throw new Error('Validation error: either channelId or channelUsername must be provided.');
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/channels');

  url.searchParams.set('part', 'contentDetails');

  if (channelId) url.searchParams.set('id', channelId);
  if (channelUsername) url.searchParams.set('forUsername', channelUsername);

  url.searchParams.set('key', ENV.YOUTUBE_API_KEY);

  const data = await fetchJson<{ items: Array<{ contentDetails: { relatedPlaylists: { uploads: string } } }> }>(
    url.toString(),
    { next: { revalidate: 86400 } },
  );

  const uploads = data.items[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) {
    throw new Error('Channel found but uploads playlist ID is missing in response.');
  }

  return YoutubePlaylistIdSchema.parse(uploads);
};

export const getYoutubePlaylistVideos = async (playlistId: string, maxResults: number = 50, pageToken?: string) => {
  if (!ENV.YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured.');
  }
  // Clamp maxResults to YouTube API allowed range [1..50]
  const clampedMax = z.number().int().min(1).max(50).catch(50).parse(maxResults);

  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');

  url.searchParams.set('part', 'snippet');
  url.searchParams.set('playlistId', playlistId);
  url.searchParams.set('maxResults', clampedMax.toString());
  url.searchParams.set('key', ENV.YOUTUBE_API_KEY);
  if (pageToken) url.searchParams.set('pageToken', pageToken);

  const data = await fetchJson<TYoutubeVideoPlaylist>(url.toString(), { next: { revalidate: 3600 } });

  if (!data || !Array.isArray(data.items)) {
    throw new Error('Invalid YouTube response: items missing or not an array');
  }

  if (data.items.length === 0) {
    throw new HttpError('Playlist not found / Playlist items not found', { status: 404 });
  }

  const filteredItems = data.items.filter((item) => {
    // Filter out deleted or private videos and any entries without a valid videoId
    const title = item?.snippet?.title;
    const videoId = item?.snippet?.resourceId?.videoId;
    const isDeleted = typeof title === 'string' && title.toLowerCase() === 'deleted video';
    const isPrivate = typeof title === 'string' && title.toLowerCase() === 'private video';
    return Boolean(videoId) && !isDeleted && !isPrivate;
  });

  const playlist = {
    ...data,
    items: filteredItems,
  };

  return YoutubeVideoPlaylistSchema.parse(playlist);
};

export const getValidators = async (timeFilter: EValidatorPeriod = EValidatorPeriod.MONTH) => {
  const url = new URL('/Participation', ENV.NEXT_PUBLIC_MONITORING_API_URL);
  url.searchParams.set('period', timeFilter);

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return ValidatorsParticipationSchema.parse(data);
};

export const getBlockHeight = async () => {
  const url = new URL('/block_height', ENV.NEXT_PUBLIC_MONITORING_API_URL);
  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return BlockHeightSchema.parse(data);
};

export const getValidatorLastIncident = async (timeFilter: EValidatorPeriod = EValidatorPeriod.MONTH) => {
  const url = new URL('/latest_incidents', ENV.NEXT_PUBLIC_MONITORING_API_URL);
  url.searchParams.set('period', timeFilter);

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  return ValidatorLastIncidentsSchema.parse(data || []);
};

export const getUsers = async (addresses?: string[]) => {
  const url = new URL('/users', ENV.NEXT_PUBLIC_MONITORING_API_URL);
  if (addresses) url.searchParams.set('addresses', addresses.join(','));

  const data = await fetchJson(url.toString(), { cache: 'no-cache' });

  console.log(data);
  return z.array(UserBaseSchema).parse(data || []);
};