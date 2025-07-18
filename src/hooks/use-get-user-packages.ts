import { QueryClient, useQuery } from '@tanstack/react-query';

import { getPackagesByUser } from '@/app/actions';

export const BASE_QUERY_KEY = ['user-packages'];

export const prefetchUserPackages = async (queryClient: QueryClient, address: string) => {
  const packages = await getPackagesByUser(address);
  queryClient.setQueryData([...BASE_QUERY_KEY, address], packages);
  return packages;
};

const useGetUserPackages = (address: string) => {
  return useQuery({
    queryFn: () => getPackagesByUser(address),
    queryKey: [...BASE_QUERY_KEY, address],
    enabled: !!address && address.length > 0,
  });
};

export default useGetUserPackages;
