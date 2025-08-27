import { QueryClient, useQuery } from '@tanstack/react-query';

import { getNamespacesByUser } from '@/app/actions';

export const BASE_QUERY_KEY = ['user-namespaces'];

export const prefetchUserNamespaces = async (queryClient: QueryClient, address: string) => {
  try {
    const queryKey = [...BASE_QUERY_KEY, address] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => getNamespacesByUser(address),
    });
    return queryClient.getQueryData(queryKey) as Awaited<ReturnType<typeof getNamespacesByUser>>;
  } catch (err) {
    console.error('prefetchUserNamespaces failed', err);
    return [] as Awaited<ReturnType<typeof getNamespacesByUser>>;
  }
};

const useGetUserNamespaces = (address: string) => {
  return useQuery({
    queryFn: () => getNamespacesByUser(address),
    queryKey: [...BASE_QUERY_KEY, address],
    enabled: !!address && address.length > 0,
  });
};

export default useGetUserNamespaces;
