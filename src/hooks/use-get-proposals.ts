import { QueryClient, useQuery } from '@tanstack/react-query';

import { getProposals } from '@/app/actions';

export const BASE_QUERY_KEY = ['proposals'] as const;

export const prefetchProposals = async (queryClient: QueryClient) => {
  const proposals = await getProposals();
  queryClient.setQueryData(BASE_QUERY_KEY, proposals);
  return proposals;
};

const useGetProposals = () => {
  return useQuery({
    queryKey: BASE_QUERY_KEY,
    queryFn: () => getProposals(),
  });
};

export default useGetProposals;
