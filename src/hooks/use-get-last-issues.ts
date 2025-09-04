import { QueryClient, useQuery } from '@tanstack/react-query';

import { getLastIssues } from '@/app/actions';

export const QUERY_KEY = ['last-issues'];

export const prefetchLastIssues = async (queryClient: QueryClient) => {
  try {
    const queryKey = [...QUERY_KEY] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => getLastIssues(5),
    });
    return queryClient.getQueryData(queryKey) as Awaited<ReturnType<typeof getLastIssues>>;
  } catch (err) {
    console.error('prefetchLastIssues failed', err);
    return [] as Awaited<ReturnType<typeof getLastIssues>>;
  }
};

const useGetLastIssues = () => {
  return useQuery({
    queryFn: () => getLastIssues(5),
    queryKey: QUERY_KEY,
  });
};

export default useGetLastIssues;
