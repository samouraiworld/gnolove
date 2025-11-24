import { QueryClient, useQuery } from '@tanstack/react-query';

import { EValidatorPeriod } from '@/utils/validators';

import { getValidatorTxContrib } from '@/app/actions';
import { POLLING_INTERVALS } from '@/constants/polling';

export const BASE_QUERY_KEY = ['tx-contrib'] as const;

export const prefetchValidatorTxContrib = async (
  queryClient: QueryClient,
  period: EValidatorPeriod = EValidatorPeriod.MONTH,
) => {
  const txContributions = await getValidatorTxContrib(period);
  queryClient.setQueryData([ ...BASE_QUERY_KEY, period ], txContributions);
  return txContributions;
};

const useGetValidatorTxContrib = (period: EValidatorPeriod) => {
  return useQuery({
    queryKey: [ ...BASE_QUERY_KEY, period ],
    queryFn: () => getValidatorTxContrib(period),
    refetchInterval: POLLING_INTERVALS.VALIDATOR_METRICS,
  });
};

export default useGetValidatorTxContrib;
