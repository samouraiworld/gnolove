import { QueryClient, useQuery } from '@tanstack/react-query';

import { TimeFilter } from '@/util/github';

import { getContributors } from '@/app/actions';

export const BASE_QUERY_KEY = ['contributors'];

export interface UseGetContributorsParams {
  timeFilter: TimeFilter;
  exclude?: boolean;
  repositories?: string[];
}

export const prefetchContributors = async (queryClient: QueryClient, params: UseGetContributorsParams) => {
  const contributors = await getContributors(params.timeFilter, params.exclude, params.repositories);
  queryClient.setQueryData([...BASE_QUERY_KEY, params], contributors);
  return contributors;
};

const useGetContributors = (params: UseGetContributorsParams) => {
  return useQuery({
    queryFn: () => getContributors(params.timeFilter, params.exclude, params.repositories),
    queryKey: [...BASE_QUERY_KEY, params],
  });
};

export default useGetContributors;
