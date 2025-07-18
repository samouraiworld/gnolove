import { QueryClient, useQuery } from '@tanstack/react-query';

import { getNamespaces } from '@/app/actions';

export const BASE_QUERY_KEY = ['namespaces'];

export const prefetchNamespaces = async (queryClient: QueryClient) => {
  const namespaces = await getNamespaces();
  queryClient.setQueryData([...BASE_QUERY_KEY], namespaces);
  return namespaces;
};

const useGetNamespaces = () => {
  return useQuery({
    queryFn: () => getNamespaces(),
    queryKey: [...BASE_QUERY_KEY],
  });
};

export default useGetNamespaces;
