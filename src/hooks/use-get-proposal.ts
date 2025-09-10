import { QueryClient, useQuery } from '@tanstack/react-query';

import { getProposal } from '@/app/actions';
import { TProposal } from '@/utils/schemas';

export const proposalQueryKey = (id: string) => ['proposal', id] as const;

export const prefetchProposal = async (queryClient: QueryClient, id: string) => {
  const proposal = await getProposal(id);
  queryClient.setQueryData<TProposal>(proposalQueryKey(id), proposal);
  return proposal;
};

const useGetProposal = (id: string) => {
  return useQuery({
    queryKey: proposalQueryKey(id),
    queryFn: () => getProposal(id),
    enabled: !!id,
  });
};

export default useGetProposal;
