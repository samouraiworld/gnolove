import { QueryClient, useQuery } from '@tanstack/react-query';

import { getNamespaces } from '@/app/actions';

export const BASE_QUERY_KEY = ['namespaces'];

export const prefetchNamespaces = async (queryClient: QueryClient) => {
  try {
    const queryKey = [...BASE_QUERY_KEY] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: getNamespaces,
    });
    return queryClient.getQueryData(queryKey) as Awaited<ReturnType<typeof getNamespaces>>;
  } catch (err) {
    console.error('prefetchNamespaces failed', err);
    return [] as Awaited<ReturnType<typeof getNamespaces>>;
  }
};

const useGetNamespaces = () => {
  return useQuery({
    queryFn: getNamespaces,
    queryKey: [...BASE_QUERY_KEY],
  });
};

export default useGetNamespaces;
