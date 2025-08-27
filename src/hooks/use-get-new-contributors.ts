import { QueryClient, useQuery } from '@tanstack/react-query';

import { getNewContributors } from '@/app/actions';

export const QUERY_KEY = ['new-contributors'];

export const prefetchNewContributors = async (queryClient: QueryClient) => {
  try {
    const queryKey = [...QUERY_KEY] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: getNewContributors,
    });
    return queryClient.getQueryData(queryKey) as Awaited<ReturnType<typeof getNewContributors>>;
  } catch (err) {
    console.error('prefetchNewContributors failed', err);
    return [] as Awaited<ReturnType<typeof getNewContributors>>;
  }
};

const useGetNewContributors = () => {
  return useQuery({
    queryFn: getNewContributors,
    queryKey: QUERY_KEY,
  });
};

export default useGetNewContributors;
