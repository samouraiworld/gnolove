import { QueryClient, useQuery } from '@tanstack/react-query';

import { getScoreFactors } from '@/app/actions';

export const QUERY_KEY = ['score-factors'];

export const prefetchScoreFactors = async (queryClient: QueryClient) => {
  try {
    const queryKey = [...QUERY_KEY] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: getScoreFactors,
    });
    return queryClient.getQueryData(queryKey) as Awaited<ReturnType<typeof getScoreFactors>>;
  } catch (err) {
    console.error('prefetchScoreFactors failed', err);
    return undefined as unknown as Awaited<ReturnType<typeof getScoreFactors>>;
  }
};

const useGetScoreFactors = () => {
  return useQuery({
    queryFn: getScoreFactors,
    queryKey: QUERY_KEY,
  });
};

export default useGetScoreFactors;
