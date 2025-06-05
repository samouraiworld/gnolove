import { QueryClient, useQuery } from '@tanstack/react-query';

import { getContributor } from '@/app/actions';

export const BASE_QUERY_KEY = ['contributor'];

export interface UseGetContributorParams {
  login: string;
}

export const prefetchContributor = async (queryClient: QueryClient, params: UseGetContributorParams) => {
  const contributor = await getContributor(params.login);
  queryClient.setQueryData([...BASE_QUERY_KEY, params], contributor);
  return contributor;
};

const useGetContributor = (params: UseGetContributorParams) => {
  return useQuery({
    queryFn: () => getContributor(params.login),
    queryKey: [...BASE_QUERY_KEY, params],
  });
};

export default useGetContributor;
