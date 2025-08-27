import { QueryClient, useQuery } from '@tanstack/react-query';

import { getNamespacesByUser } from '@/app/actions';

export const BASE_QUERY_KEY = ['user-namespaces'];

export const prefetchUserNamespaces = async (queryClient: QueryClient, address: string) => {
  try {
    const namespaces = await getNamespacesByUser(address);
    queryClient.setQueryData([...BASE_QUERY_KEY, address], namespaces);
    return namespaces;
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
