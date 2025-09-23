import { QueryClient, useQuery } from '@tanstack/react-query';

import { getGovdaoMembers } from '@/app/actions';

export const BASE_QUERY_KEY = ['govdao-members'] as const;

export const prefetchGovdaoMembers = async (queryClient: QueryClient) => {
  const govdaoMembers = await getGovdaoMembers();
  queryClient.setQueryData(BASE_QUERY_KEY, govdaoMembers);
  return govdaoMembers;
};

const useGetGovdaoMembers = () => {
  return useQuery({
    queryKey: BASE_QUERY_KEY,
    queryFn: () => getGovdaoMembers(),
  });
};

export default useGetGovdaoMembers;
