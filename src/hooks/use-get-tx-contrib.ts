import { QueryClient, useQuery } from '@tanstack/react-query';

import { getValidatorTxContrib } from '@/app/actions';

export const BASE_QUERY_KEY = ['tx-contrib'] as const;

export const prefetchValidatorTxContrib = async (queryClient: QueryClient) => {
  const txContributions = await getValidatorTxContrib();
  queryClient.setQueryData(BASE_QUERY_KEY, txContributions);
  return txContributions;
};

const useGetValidatorTxContrib = () => {
  return useQuery({
    queryKey: BASE_QUERY_KEY,
    queryFn: () => getValidatorTxContrib(),
    refetchInterval: 5_000,
  });
};

export default useGetValidatorTxContrib;
