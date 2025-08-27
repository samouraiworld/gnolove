import { QueryClient, useQuery } from '@tanstack/react-query';

import { getProposalsByUser } from '@/app/actions';

export const BASE_QUERY_KEY = ['user-proposals'];

export const prefetchUserProposals = async (queryClient: QueryClient, address: string) => {
  const proposals = await getProposalsByUser(address);
  queryClient.setQueryData([...BASE_QUERY_KEY, address], proposals);
  return proposals;
};

const useGetUserProposals = (address: string) => {
  return useQuery({
    queryFn: () => getProposalsByUser(address),
    queryKey: [...BASE_QUERY_KEY, address],
    enabled: !!address && address.length > 0,
  });
};

export default useGetUserProposals;
