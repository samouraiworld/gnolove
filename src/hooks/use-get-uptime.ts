import { QueryClient, useQuery } from '@tanstack/react-query';

import { getValidatorUptime } from '@/app/actions';

export const BASE_QUERY_KEY = ['uptime'] as const;

export const prefetchValidatorUptime = async (queryClient: QueryClient) => {
  const uptime = await getValidatorUptime();
  queryClient.setQueryData(BASE_QUERY_KEY, uptime);
  return uptime;
};

const useGetValidatorUptime = () => {
  return useQuery({
    queryKey: BASE_QUERY_KEY,
    queryFn: () => getValidatorUptime(),
    refetchInterval: 30_000,
  });
};

export default useGetValidatorUptime;
