import { type InfiniteData, QueryClient, useInfiniteQuery } from '@tanstack/react-query';

import { getYoutubePlaylistVideos } from '@/app/actions';
import type { TYoutubeVideoPlaylist } from '@/utils/schemas';

export interface UseYoutubePlaylistVideosParams {
  playlistId: string;
  maxResults?: number;
}

export const YOUTUBE_PLAYLIST_QUERY_KEY = ['youtube-playlist-videos'] as const;

const getYoutubePlaylistQueryKey = (playlistId: string, maxResults: number) =>
  [...YOUTUBE_PLAYLIST_QUERY_KEY, playlistId, maxResults] as const;

const playlistQueryFn = (playlistId: string, maxResults: number) =>
  ({ pageParam }: { pageParam?: string }) => getYoutubePlaylistVideos(playlistId, maxResults, pageParam);

export const prefetchYoutubePlaylistVideos = async (
  queryClient: QueryClient,
  { playlistId, maxResults = 6 }: UseYoutubePlaylistVideosParams,
) => {
  const queryKey = getYoutubePlaylistQueryKey(playlistId, maxResults);

  try {
    await queryClient.prefetchInfiniteQuery({
      queryKey,
      initialPageParam: undefined,
      queryFn: playlistQueryFn(playlistId, maxResults),
    });
    return queryClient.getQueryData<InfiniteData<TYoutubeVideoPlaylist>>(queryKey);
  } catch (error) {
    console.error('prefetchYoutubePlaylistVideos failed', error);
    return undefined;
  }
};

const useYoutubePlaylistVideos = ({ playlistId, maxResults = 6 }: UseYoutubePlaylistVideosParams) => {
  return useInfiniteQuery({
    queryKey: getYoutubePlaylistQueryKey(playlistId, maxResults),
    queryFn: playlistQueryFn(playlistId, maxResults),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: TYoutubeVideoPlaylist) => lastPage.nextPageToken ?? undefined,
    enabled: !!playlistId,
  });
};

export default useYoutubePlaylistVideos;
