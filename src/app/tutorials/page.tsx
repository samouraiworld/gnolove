import { Metadata } from 'next';
import Tutorials from '@/components/features/tutorials/tutorials';
import { getYoutubePlaylistVideos } from '@/app/actions';
import { TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID } from '@/features/tutorials/constants';

export const metadata: Metadata = {
  title: 'Tutorials and guides',
};

const TutorialsPage = async () => {
  const videos = await getYoutubePlaylistVideos(TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID);

  return <Tutorials videos={videos} />;
};

export default TutorialsPage;