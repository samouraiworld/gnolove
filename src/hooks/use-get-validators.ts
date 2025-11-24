import { QueryClient, useQuery } from '@tanstack/react-query';

import { EValidatorPeriod } from '@/utils/validators';

import { getValidators } from '@/app/actions';
import { POLLING_INTERVALS } from '@/constants/polling';

export const BASE_QUERY_KEY = ['validators'] as const;

export const prefetchValidators = async (
  queryClient: QueryClient,
  period: EValidatorPeriod = EValidatorPeriod.MONTH,
) => {
  const validators = await getValidators(period);
  queryClient.setQueryData([...BASE_QUERY_KEY, period], validators);
  return validators;
};

const useGetValidators = (period: EValidatorPeriod) => {
  return useQuery({
    queryKey: [ ...BASE_QUERY_KEY, period ],
    queryFn: () => getValidators(period),
    refetchInterval: POLLING_INTERVALS.VALIDATOR_METRICS,
  });
};

export default useGetValidators;
