import { Metadata } from 'next';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import ScoreboardPage from '@/components/features/scoreboard/scoreboard-page';

import { getIds } from '@/utils/array';
import { getTimeFilterFromSearchParam, TimeFilter } from '@/utils/github';
import { getSelectedRepositoriesFromSearchParam } from '@/utils/repositories';
import { prefetchContributors } from '@/hooks/use-get-contributors';
import { prefetchLastIssues } from '@/hooks/use-get-last-issues';
import { prefetchMilestone } from '@/hooks/use-get-milestone';
import { prefetchNewContributors } from '@/hooks/use-get-new-contributors';
import { prefetchRepositories } from '@/hooks/use-get-repositories';
import { SearchParamsFilters } from '@/types/url-filters';
import { getYoutubeChannelUploadsPlaylistId } from '@/app/actions';
import { prefetchYoutubePlaylistVideos } from '@/hooks/use-get-youtube-playlist-videos';
import { GNOLAND_YOUTUBE_CHANNEL_ID} from '@/constants/videos';

export const metadata: Metadata = {
  title: 'Top of Gnome',
};

const prefetchVideos = async (queryClient: QueryClient) => {
  const uploadsPlaylistId = await getYoutubeChannelUploadsPlaylistId({ channelId: GNOLAND_YOUTUBE_CHANNEL_ID });

  await prefetchYoutubePlaylistVideos(queryClient, uploadsPlaylistId, 6);
};

const HomePage = async ({ searchParams: { f, e, r } }: SearchParamsFilters) => {
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
    prefetchVideos(queryClient),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ScoreboardPage />
    </HydrationBoundary>
  );
};

export default HomePage;
