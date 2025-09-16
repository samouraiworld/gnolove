import { QueryClient, useQuery } from '@tanstack/react-query';

import { EValidatorPeriod } from '@/utils/validators';

import { getValidators } from '@/app/actions';

export const BASE_QUERY_KEY = ['validators'] as const;

export const prefetchValidators = async (
  queryClient: QueryClient,
  period: EValidatorPeriod = EValidatorPeriod.MONTH,
) => {
  const validators = await getValidators(period);
  queryClient.setQueryData(BASE_QUERY_KEY, validators);
  return validators;
};

const useGetValidators = (period: EValidatorPeriod = EValidatorPeriod.MONTH) => {
  return useQuery({
    queryKey: BASE_QUERY_KEY,
    queryFn: () => getValidators(period),
  });
};

export default useGetValidators;
