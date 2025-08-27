import { QueryClient, useQuery } from '@tanstack/react-query';

import { getPackagesByUser } from '@/app/actions';

export const BASE_QUERY_KEY = ['user-packages'];

export const prefetchUserPackages = async (queryClient: QueryClient, address: string) => {
  try {
    const packages = await getPackagesByUser(address);
    queryClient.setQueryData([...BASE_QUERY_KEY, address], packages);
    return packages;
  } catch (err) {
    console.error('prefetchUserPackages failed', err);
    return [] as Awaited<ReturnType<typeof getPackagesByUser>>;
  }
};

const useGetUserPackages = (address: string) => {
  return useQuery({
    queryFn: () => getPackagesByUser(address),
    queryKey: [...BASE_QUERY_KEY, address],
    enabled: !!address && address.length > 0,
  });
};

export default useGetUserPackages;
