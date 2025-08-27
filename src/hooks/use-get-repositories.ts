import { QueryClient, useQuery } from '@tanstack/react-query';

import { getRepositories } from '@/app/actions';

export const QUERY_KEY = ['repositories'];

export const prefetchRepositories = async (queryClient: QueryClient) => {
  try {
    const queryKey = [...QUERY_KEY] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: getRepositories,
    });
    return queryClient.getQueryData(queryKey) as Awaited<ReturnType<typeof getRepositories>>;
  } catch (err) {
    console.error('prefetchRepositories failed', err);
    return [] as Awaited<ReturnType<typeof getRepositories>>;
  }
};

const useGetRepositories = () => {
  return useQuery({
    queryFn: getRepositories,
    queryKey: QUERY_KEY,
  });
};

export default useGetRepositories;
