import { QueryClient, useQuery } from '@tanstack/react-query';

import { getPackages } from '@/app/actions';

export const BASE_QUERY_KEY = ['packages'];

export const prefetchPackages = async (queryClient: QueryClient) => {
  try {
    const queryKey = [...BASE_QUERY_KEY] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: getPackages,
    });
    return queryClient.getQueryData(queryKey) as Awaited<ReturnType<typeof getPackages>>;
  } catch (err) {
    console.error('prefetchPackages failed', err);
    return [] as Awaited<ReturnType<typeof getPackages>>;
  }
};

const useGetPackages = () => {
  return useQuery({
    queryFn: getPackages,
    queryKey: [...BASE_QUERY_KEY],
  });
};

export default useGetPackages;
