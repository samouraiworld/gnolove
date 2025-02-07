import { QueryClient, useQuery } from '@tanstack/react-query';

import { getLastIssues } from '@/app/actions';

export const QUERY_KEY = ['last-issues'];

export const prefetchLastIssues = async (queryClient: QueryClient) => {
  const lastIssues = await getLastIssues(5);
  queryClient.setQueryData(QUERY_KEY, lastIssues);
  return lastIssues;
};

const useGetLastIssues = () => {
  return useQuery({
    queryFn: () => getLastIssues(5),
    queryKey: QUERY_KEY,
  });
};

export default useGetLastIssues;
