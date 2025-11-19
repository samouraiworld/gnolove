import { QueryClient, useQuery } from '@tanstack/react-query';
import { getLastSync } from '@/app/actions';

export const BASE_QUERY_KEY = ['last-sync'] as const;

export const prefetchLastSync = async (queryClient: QueryClient) => {
  try {
    await queryClient.prefetchQuery({
      queryKey: BASE_QUERY_KEY,
      queryFn: () => getLastSync(),
    });
    return queryClient.getQueryData(BASE_QUERY_KEY) as Awaited<ReturnType<typeof getLastSync>>;
  } catch (err) {
    console.error('prefetchLastSync failed', err);
    return null as Awaited<ReturnType<typeof getLastSync>>;
  }
};

const useGetLastSync = () => {
  return useQuery({
    queryKey: BASE_QUERY_KEY,
    queryFn: () => getLastSync(),
  });
};

export default useGetLastSync;
