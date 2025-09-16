import { QueryClient, useQuery } from '@tanstack/react-query';

import { getBlockHeight } from '@/app/actions';

export const BASE_QUERY_KEY = ['block-height'] as const;

export const prefetchBlockHeight = async (queryClient: QueryClient) => {
  const blockHeight = await getBlockHeight();
  queryClient.setQueryData(BASE_QUERY_KEY, blockHeight);
  return blockHeight;
};

const useGetBlockHeight = () => {
  return useQuery({
    queryKey: BASE_QUERY_KEY,
    queryFn: () => getBlockHeight(),
    refetchInterval: 5_000,
  });
};

export default useGetBlockHeight;
