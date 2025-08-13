import { QueryClient, useQuery } from '@tanstack/react-query';

import { getYoutubeChannelUploadsPlaylistId } from '@/app/actions';

export const QUERY_KEY = ['youtube-channel-uploads-playlist-id'];

export const prefetchYoutubeChannelUploadsPlaylistId = async (queryClient: QueryClient, searchParams: { channelId?: string; channelUsername?: string }) => {
  const videos = await getYoutubeChannelUploadsPlaylistId(searchParams);
  queryClient.setQueryData([...QUERY_KEY, searchParams.channelId || searchParams.channelUsername], videos);
  return videos;
};

const useGetYoutubeChannelUploadsPlaylistId = (searchParams: { channelId?: string; channelUsername?: string }) => {
  return useQuery({
    queryFn: () => getYoutubeChannelUploadsPlaylistId(searchParams),
    queryKey: [...QUERY_KEY, searchParams.channelId || searchParams.channelUsername],
  });
};

export default useGetYoutubeChannelUploadsPlaylistId;
