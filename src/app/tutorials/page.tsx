import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import Tutorials from '@/components/features/tutorials/tutorials';
import { TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID } from '@/features/tutorials/constants';
import LayoutContainer from '@/layouts/layout-container';
import { prefetchYoutubePlaylistVideos } from '@/hooks/use-youtube-playlist-videos';

export const metadata: Metadata = {
  title: 'Tutorials and guides',
};

const TutorialsPage = async () => {
  const queryClient = new QueryClient();

  await prefetchYoutubePlaylistVideos(queryClient, {
    playlistId: TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID,
    maxResults: 6,
  }).catch((err) => {
    console.error('Tutorials YouTube fetch failed', err);
    return undefined;
  });

  return (
    <LayoutContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Tutorials />
      </HydrationBoundary>
    </LayoutContainer>
  );
};

export default TutorialsPage;