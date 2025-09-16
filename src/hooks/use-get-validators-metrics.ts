import { QueryClient, useQuery } from '@tanstack/react-query';

import { getMonitoringMetrics } from '@/app/actions';

export const BASE_QUERY_KEY = ['validators-monitoring-metrics'] as const;

export const prefetchValidatorsMetrics = async (queryClient: QueryClient) => {
  const metrics = await getMonitoringMetrics();
  queryClient.setQueryData(BASE_QUERY_KEY, metrics);
  return metrics;
};

const useGetValidatorsMetrics = () => {
  return useQuery({
    queryKey: BASE_QUERY_KEY,
    queryFn: () => getMonitoringMetrics(),
    refetchInterval: 15_000,
  });
};

export default useGetValidatorsMetrics;
