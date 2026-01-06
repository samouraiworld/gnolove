import { useQuery, QueryClient } from '@tanstack/react-query';

import { getFreshlyMerged } from '@/app/actions';

export const QUERY_KEY = ['last-prs'];


export const prefetchFreshlyMerged = async (queryClient: QueryClient) => {
  try {
    const queryKey = [...QUERY_KEY] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: getFreshlyMerged,
    });
    return queryClient.getQueryData(queryKey) as Awaited<ReturnType<typeof getFreshlyMerged>>;
  } catch (err) {
    console.error('prefetchNewContributors failed', err);
    return [] as Awaited<ReturnType<typeof getFreshlyMerged>>;
  }
};


const useGetFreshlyMerged = () => {
  return useQuery({
    queryFn: getFreshlyMerged,
    queryKey: QUERY_KEY,
  });
};


export default useGetFreshlyMerged;
