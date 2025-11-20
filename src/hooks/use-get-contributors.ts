import { QueryClient, useQuery } from '@tanstack/react-query';

import { TimeFilter } from '@/utils/github';

import { getContributors } from '@/app/actions';

export const BASE_QUERY_KEY = ['contributors'];

export interface UseGetContributorsParams {
  timeFilter: TimeFilter;
  exclude?: boolean;
  repositories?: string[];
}

export const prefetchContributors = async (queryClient: QueryClient, params: UseGetContributorsParams) => {
  try {
    const queryKey = [...BASE_QUERY_KEY, params] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => getContributors(params.timeFilter, params.exclude, params.repositories),
    });
    return queryClient.getQueryData(queryKey) as Awaited<ReturnType<typeof getContributors>>;
  } catch (err) {
    console.error('prefetchContributors failed', err);
    return { users: [], lastSyncedAt: null } as Awaited<ReturnType<typeof getContributors>>;
  }
};

const useGetContributors = (params: UseGetContributorsParams) => {
  return useQuery({
    queryFn: () => getContributors(params.timeFilter, params.exclude, params.repositories),
    queryKey: [...BASE_QUERY_KEY, params],
  });
};

export default useGetContributors;
