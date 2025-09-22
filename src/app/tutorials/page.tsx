import { Metadata } from 'next';
import Tutorials from '@/components/features/tutorials/tutorials';
import { getYoutubePlaylistVideos } from '@/app/actions';
import { TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID } from '@/features/tutorials/constants';
import LayoutContainer from '@/layouts/layout-container';
import type { TYoutubeVideoPlaylist } from '@/utils/schemas';

export const metadata: Metadata = {
  title: 'Tutorials and guides',
};

const TutorialsPage = async () => {
  const playlistItems: TYoutubeVideoPlaylist = await getYoutubePlaylistVideos(TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID, 6)
    .catch((err) => {
      console.error('Tutorials YouTube fetch failed', err);
      return {
        kind: '',
        etag: '',
        items: [],
        nextPageToken: '',
        prevPageToken: '',
        pageInfo: { totalResults: 0, resultsPerPage: 0 },
      } as TYoutubeVideoPlaylist;
    });

  return (
    <LayoutContainer>
      <Tutorials playlistItems={playlistItems} />
    </LayoutContainer>
  );
};

export default TutorialsPage;