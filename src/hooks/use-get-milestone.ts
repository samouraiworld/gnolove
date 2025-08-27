import { QueryClient, useQuery } from '@tanstack/react-query';

import { getMilestone } from '@/app/actions';

export const QUERY_KEY = ['milestone'];

export const prefetchMilestone = async (queryClient: QueryClient) => {
  try {
    const milestone = await getMilestone();
    queryClient.setQueryData(QUERY_KEY, milestone);
    return milestone;
  } catch (err) {
    console.error('prefetchMilestone failed', err);
    return undefined as unknown as Awaited<ReturnType<typeof getMilestone>>;
  }
};

const useGetMilestone = () => {
  return useQuery({
    queryFn: () => getMilestone(),
    queryKey: QUERY_KEY,
  });
};

export default useGetMilestone;
