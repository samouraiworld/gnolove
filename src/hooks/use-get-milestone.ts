import { QueryClient, useQuery } from '@tanstack/react-query';

import { getMilestone } from '@/app/actions';

export const QUERY_KEY = ['milestone'];

export const prefetchMilestone = async (queryClient: QueryClient) => {
  try {
    const queryKey = [...QUERY_KEY] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: getMilestone,
    });
    return queryClient.getQueryData(queryKey) as Awaited<ReturnType<typeof getMilestone>>;
  } catch (err) {
    console.error('prefetchMilestone failed', err);
    return undefined as unknown as Awaited<ReturnType<typeof getMilestone>>;
  }
};

const useGetMilestone = () => {
  return useQuery({
    queryFn: getMilestone,
    queryKey: QUERY_KEY,
  });
};

export default useGetMilestone;
