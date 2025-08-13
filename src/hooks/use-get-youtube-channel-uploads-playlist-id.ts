import { QueryClient, useQuery } from '@tanstack/react-query';

import { getYoutubeChannelUploadsPlaylistId } from '@/app/actions';

export const QUERY_KEY = ['youtube-channel-uploads-playlist-id'];

export const prefetchYoutubeChannelUploadsPlaylistId = async (queryClient: QueryClient, searchParams: { channelId?: string; channelUsername?: string }) => {
  // Guard: avoid API call and undefined cache key when both params are missing
  if (!searchParams.channelId && !searchParams.channelUsername) {
    return null;
  }
  const playlistId = await getYoutubeChannelUploadsPlaylistId(searchParams);
  const cacheKey = searchParams.channelId ?? searchParams.channelUsername;
  queryClient.setQueryData([...QUERY_KEY, cacheKey], playlistId);
  return playlistId;
};

const useGetYoutubeChannelUploadsPlaylistId = (searchParams: { channelId?: string; channelUsername?: string }) => {
  return useQuery({
    queryFn: () => getYoutubeChannelUploadsPlaylistId(searchParams),
    queryKey: [...QUERY_KEY, searchParams],
    enabled: Boolean(searchParams.channelId || searchParams.channelUsername),
  });
};

export default useGetYoutubeChannelUploadsPlaylistId;
