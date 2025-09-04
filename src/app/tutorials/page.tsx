import { Metadata } from 'next';
import Tutorials from '@/components/features/tutorials/tutorials';
import { getYoutubePlaylistVideos } from '@/app/actions';
import { TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID } from '@/features/tutorials/constants';
import LayoutContainer from '@/layouts/layout-container';

export const metadata: Metadata = {
  title: 'Tutorials and guides',
};

const TutorialsPage = async () => {
  const videos = await getYoutubePlaylistVideos(TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID)
    .catch((err) => {
      console.error('Tutorials YouTube fetch failed', err);
      return [];
    });

  return (
    <LayoutContainer>
      <Tutorials videos={videos} />
    </LayoutContainer>
  );
};

export default TutorialsPage;