import { QueryClient, useQuery } from '@tanstack/react-query';

import { getMilestone } from '@/app/actions';

export const QUERY_KEY = ['milestone'];

export const prefetchMilestone = async (queryClient: QueryClient) => {
  const milestone = await getMilestone();
  queryClient.setQueryData(QUERY_KEY, milestone);
  return milestone;
};

const useGetMilestone = () => {
  return useQuery({
    queryFn: () => getMilestone(),
    queryKey: QUERY_KEY,
  });
};

export default useGetMilestone;
