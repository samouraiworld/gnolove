import { QueryClient, useQuery } from '@tanstack/react-query';

import { getValidatorLastIncident } from '@/app/actions';
import { EValidatorPeriod } from '@/utils/validators';

export const BASE_QUERY_KEY = ['validators-last-incident'] as const;

export const prefetchValidatorsLastIncident = async (queryClient: QueryClient, timeFilter: EValidatorPeriod = EValidatorPeriod.MONTH) => {
  const validatorLastIncident = await getValidatorLastIncident(timeFilter);
  queryClient.setQueryData([ ...BASE_QUERY_KEY, timeFilter ], validatorLastIncident);
  return validatorLastIncident;
};

const useGetValidatorsLastIncident = (timeFilter: EValidatorPeriod = EValidatorPeriod.MONTH) => {
  return useQuery({
    queryKey: [ ...BASE_QUERY_KEY, timeFilter ],
    queryFn: () => getValidatorLastIncident(timeFilter),
    refetchInterval: 30_000,
  });
};

export default useGetValidatorsLastIncident;
