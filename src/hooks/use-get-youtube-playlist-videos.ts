import { QueryClient, useQuery } from '@tanstack/react-query';

import { getYoutubePlaylistVideos } from '@/app/actions';

export const QUERY_KEY = ['youtube-playlist-videos'];

export const prefetchYoutubePlaylistVideos = async (queryClient: QueryClient, playlistId: string, maxResults?: number) => {
  const videos = await getYoutubePlaylistVideos(playlistId, maxResults);
  queryClient.setQueryData([...QUERY_KEY, playlistId], videos);
  return videos;
};

const useGetYoutubePlaylistVideos = (playlistId: string, maxResults?: number) => {
  return useQuery({
    queryFn: () => getYoutubePlaylistVideos(playlistId, maxResults),
    queryKey: [...QUERY_KEY, playlistId],
  });
};

export default useGetYoutubePlaylistVideos;
