import { QueryClient, useQuery } from '@tanstack/react-query';

import { EValidatorPeriod } from '@/utils/validators';

import { getValidatorMissingBlock } from '@/app/actions';
import { POLLING_INTERVALS } from '@/constants/polling';

export const BASE_QUERY_KEY = ['missing-block'] as const;

export const prefetchValidatorsMissingBlock = async (
  queryClient: QueryClient,
  period: EValidatorPeriod = EValidatorPeriod.MONTH,
) => {
  const validators = await getValidatorMissingBlock(period);
  queryClient.setQueryData([ ...BASE_QUERY_KEY, period ], validators);
  return validators;
};

const useGetValidatorsMissingBlock = (period: EValidatorPeriod) => {
  return useQuery({
    queryKey: [ ...BASE_QUERY_KEY, period ],
    queryFn: () => getValidatorMissingBlock(period),
    refetchInterval: POLLING_INTERVALS.VALIDATOR_METRICS,
  });
};

export default useGetValidatorsMissingBlock;