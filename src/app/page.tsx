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
import { prefetchFreshlyMerged } from '@/hooks/use-get-freshly-merged';
import { prefetchRepositories } from '@/hooks/use-get-repositories';
import { SearchParamsFilters } from '@/types/url-filters';
import { getYoutubeChannelUploadsPlaylistId } from '@/app/actions';
import { GNOLAND_YOUTUBE_CHANNEL_ID } from '@/constants/videos';
import { prefetchScoreFactors } from '@/hooks/use-get-score-factors';
import LayoutContainer from '@/layouts/layout-container';
import { prefetchYoutubePlaylistVideos } from '@/hooks/use-youtube-playlist-videos';
import type { TYoutubeVideoPlaylist } from '@/utils/schemas';

export const metadata: Metadata = {
  title: 'Top of Gnome',
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
    prefetchFreshlyMerged(queryClient),
    prefetchScoreFactors(queryClient),
  ]);

  const uploadsPlaylistId = await getYoutubeChannelUploadsPlaylistId({ channelId: GNOLAND_YOUTUBE_CHANNEL_ID }).catch(() => {
    console.error('YouTube uploads playlist ID prefetch failed');
    return '';
  });
  let videos: TYoutubeVideoPlaylist | undefined;
  if (uploadsPlaylistId) {
    const playlistData = await prefetchYoutubePlaylistVideos(queryClient, {
      playlistId: uploadsPlaylistId,
      maxResults: 6,
    }).catch((err) => {
      console.error('YouTube videos prefetch failed', err);
      return undefined;
    });
    videos = playlistData?.pages?.[0];
  }

  return (
    <LayoutContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ScoreboardPage videos={videos} />
      </HydrationBoundary>
    </LayoutContainer>
  );
};

export default HomePage;
