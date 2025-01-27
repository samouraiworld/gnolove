import { QueryClient, useQuery } from '@tanstack/react-query';

import { getNewContributors } from '@/app/actions';

export const QUERY_KEY = ['new-contributors'];

export const prefetchNewContributors = async (queryClient: QueryClient) => {
  const newContributors = await getNewContributors();
  queryClient.setQueryData(QUERY_KEY, newContributors);
  return newContributors;
};

const useGetNewContributors = () => {
  return useQuery({
    queryFn: getNewContributors,
    queryKey: QUERY_KEY,
  });
};

export default useGetNewContributors;
