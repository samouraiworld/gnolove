import { QueryClient, useQuery } from '@tanstack/react-query';

import { getPackages } from '@/app/actions';

export const BASE_QUERY_KEY = ['packages'];

export const prefetchPackages = async (queryClient: QueryClient) => {
  try {
    const packages = await getPackages();
    queryClient.setQueryData([...BASE_QUERY_KEY], packages);
    return packages;
  } catch (err) {
    console.error('prefetchPackages failed', err);
    return [] as Awaited<ReturnType<typeof getPackages>>;
  }
};

const useGetPackages = () => {
  return useQuery({
    queryFn: () => getPackages(),
    queryKey: [...BASE_QUERY_KEY],
  });
};

export default useGetPackages;
