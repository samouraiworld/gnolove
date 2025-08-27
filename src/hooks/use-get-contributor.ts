import { QueryClient, useQuery } from '@tanstack/react-query';

import { getContributor } from '@/app/actions';

export const BASE_QUERY_KEY = ['contributor'];

export const prefetchContributor = async (queryClient: QueryClient, login: string) => {
  try {
    const contributor = await getContributor(login);
    queryClient.setQueryData([...BASE_QUERY_KEY, login], contributor);
    return contributor;
  } catch (err) {
    console.error('prefetchContributor failed', err);
    return undefined as unknown as Awaited<ReturnType<typeof getContributor>>;
  }
};

const useGetContributor = (login: string) => {
  return useQuery({
    queryFn: () => getContributor(login),
    queryKey: [...BASE_QUERY_KEY, login],
  });
};

export default useGetContributor;
