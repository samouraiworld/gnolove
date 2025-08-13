import { Metadata } from 'next';
import Tutorials from '@/components/features/tutorials/tutorials';
import { QueryClient } from '@tanstack/react-query';
import { prefetchYoutubePlaylistVideos } from '@/hooks/use-get-youtube-playlist-videos';
import { TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID } from '@/features/tutorials/constants';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export const metadata: Metadata = {
  title: 'Tutorials and guides',
};

const TutorialsPage = async () => {
  const queryClient = new QueryClient();

  await prefetchYoutubePlaylistVideos(queryClient, TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Tutorials />
    </HydrationBoundary>
  );
};

export default TutorialsPage;