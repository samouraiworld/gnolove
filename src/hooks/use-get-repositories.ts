import { QueryClient, useQuery } from '@tanstack/react-query';

import { getRepositories } from '@/app/actions';

export const QUERY_KEY = ['repositories'];

export const prefetchRepositories = async (queryClient: QueryClient) => {
  const repositories = await getRepositories();
  queryClient.setQueryData(QUERY_KEY, repositories);
  return repositories;
};

const useGetRepositories = () => {
  return useQuery({
    queryFn: () => getRepositories(),
    queryKey: QUERY_KEY,
  });
};

export default useGetRepositories;
