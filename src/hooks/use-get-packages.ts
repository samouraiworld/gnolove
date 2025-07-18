import { QueryClient, useQuery } from '@tanstack/react-query';

import { getPackages } from '@/app/actions';

export const BASE_QUERY_KEY = ['packages'];

export const prefetchPackages = async (queryClient: QueryClient) => {
  const packages = await getPackages();
  queryClient.setQueryData([...BASE_QUERY_KEY], packages);
  return packages;
};

const useGetPackages = () => {
  return useQuery({
    queryFn: () => getPackages(),
    queryKey: [...BASE_QUERY_KEY],
  });
};

export default useGetPackages;
