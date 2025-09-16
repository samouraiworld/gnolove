import { QueryClient, useQuery } from '@tanstack/react-query';

import { getValidatorLastIncident } from '@/app/actions';

export const BASE_QUERY_KEY = ['validators-last-incident'] as const;

export const prefetchValidatorsLastIncident = async (queryClient: QueryClient) => {
  const validatorLastIncident = await getValidatorLastIncident();
  queryClient.setQueryData(BASE_QUERY_KEY, validatorLastIncident);
  return validatorLastIncident;
};

const useGetValidatorsLastIncident = () => {
  return useQuery({
    queryKey: BASE_QUERY_KEY,
    queryFn: () => getValidatorLastIncident(),
    refetchInterval: 30_000,
  });
};

export default useGetValidatorsLastIncident;
