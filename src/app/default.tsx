import { Metadata } from 'next';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { prefetchContributors } from '@/hooks/use-get-contributors';
import { prefetchLastIssues } from '@/hooks/use-get-last-issues';
import { prefetchMilestone } from '@/hooks/use-get-milestone';
import { prefetchNewContributors } from '@/hooks/use-get-new-contributors';
import { prefetchRepositories } from '@/hooks/use-get-repositories';

import { getIds } from '@/utils/array';
import { getTimeFilterFromSearchParam, TimeFilter } from '@/utils/github';
import { getSelectedRepositoriesFromSearchParam } from '@/utils/repositories';

import { GNOLAND_YOUTUBE_CHANNEL_ID } from '@/constants/videos';

import { SearchParamsFilters } from '@/types/url-filters';

import { getYoutubeChannelUploadsPlaylistId, getYoutubePlaylistVideos } from '@/app/actions';
import ScoreboardPage from '@/components/features/scoreboard/scoreboard-page';

export const metadata: Metadata = {
  title: 'Top of Gnome',
};

const HomePage = async ({ searchParams }: SearchParamsFilters) => {
  const { f, e, r } = await searchParams;
  const timeFilter = getTimeFilterFromSearchParam(f, TimeFilter.MONTHLY);
  const exclude = !!e;

  const queryClient = new QueryClient();

  const allRepositories = await prefetchRepositories(queryClient);

  const selectedRepositories = getSelectedRepositoriesFromSearchParam(r, allRepositories);

  await Promise.all([
    prefetchMilestone(queryClient),
    prefetchContributors(queryClient, { timeFilter: TimeFilter.ALL_TIME }),
    prefetchContributors(queryClient, { timeFilter, exclude, repositories: getIds(selectedRepositories) }),
    prefetchLastIssues(queryClient),
    prefetchNewContributors(queryClient),
  ]);

  const uploadsPlaylistId = await getYoutubeChannelUploadsPlaylistId({ channelId: GNOLAND_YOUTUBE_CHANNEL_ID }).catch(
    () => {
      console.error('YouTube uploads playlist ID prefetch failed');
      return '';
    },
  );
  const videos = uploadsPlaylistId
    ? await getYoutubePlaylistVideos(uploadsPlaylistId, 6).catch(() => {
      console.error('YouTube videos prefetch failed');
      return [];
    })
    : [];

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ScoreboardPage videos={videos} />
    </HydrationBoundary>
  );
};

export default HomePage;
