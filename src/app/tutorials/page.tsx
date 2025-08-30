import { Metadata } from 'next';
import Tutorials from '@/components/features/tutorials/tutorials';
import { getYoutubePlaylistVideos } from '@/app/actions';
import { TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID } from '@/features/tutorials/constants';
import LayoutContainer from '@/layouts/layout-container';

export const metadata: Metadata = {
  title: 'Tutorials and guides',
};

const TutorialsPage = async () => {
  let videos = [] as Awaited<ReturnType<typeof getYoutubePlaylistVideos>>;
  try {
    videos = await getYoutubePlaylistVideos(TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID);
  } catch (err) {
    console.error('Tutorials YouTube fetch failed', err);
    videos = [] as Awaited<ReturnType<typeof getYoutubePlaylistVideos>>;
  }

  return (
    <LayoutContainer>
      <Tutorials videos={videos} />
    </LayoutContainer>
  );
};

export default TutorialsPage;