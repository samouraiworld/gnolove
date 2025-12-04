import { QueryClient, useQuery } from '@tanstack/react-query';

import { getValidatorOperationTime } from '@/app/actions';

export const BASE_QUERY_KEY = ['operation-time'] as const;

export const prefetchValidatorOperationTime = async (queryClient: QueryClient) => {
  const operationTime = await getValidatorOperationTime();
  queryClient.setQueryData(BASE_QUERY_KEY, operationTime);
  return operationTime;
};

const useGetValidatorOperationTime = () => {
  return useQuery({
    queryKey: BASE_QUERY_KEY,
    queryFn: () => getValidatorOperationTime(),
  });
};

export default useGetValidatorOperationTime;
