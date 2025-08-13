import { QueryClient, useQuery } from '@tanstack/react-query';

import { getYoutubePlaylistVideos } from '@/app/actions';

export const QUERY_KEY = ['youtube-playlist-videos'];

export const prefetchYoutubePlaylistVideos = async (queryClient: QueryClient, playlistId: string, maxResults?: number) => {
  const videos = await getYoutubePlaylistVideos(playlistId, maxResults);
  queryClient.setQueryData([...QUERY_KEY, playlistId, maxResults ?? null], videos);
  return videos;
};

const useGetYoutubePlaylistVideos = (playlistId: string, maxResults?: number) => {
  return useQuery({
    queryFn: () => getYoutubePlaylistVideos(playlistId, maxResults),
    queryKey: [...QUERY_KEY, playlistId, maxResults ?? 'all'],
    enabled: Boolean(playlistId),
    // If you rely on SSR prefetch + hydration, consider a long staleTime to avoid client refetch and API key exposure.
    staleTime: 1000 * 60 * 60, // 1h
    refetchOnWindowFocus: false,
  });
};

export default useGetYoutubePlaylistVideos;
