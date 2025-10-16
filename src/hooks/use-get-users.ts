import { QueryClient, useQuery } from '@tanstack/react-query';

import { getUsers } from '@/app/actions';

export const QUERY_KEY = ['users'];

export const prefetchUsers = async (queryClient: QueryClient, addresses?: string[]) => {
  try {
    const queryKey = [...QUERY_KEY, ...(addresses || [])] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => getUsers(addresses),
    });
    return queryClient.getQueryData(queryKey) as Awaited<ReturnType<typeof getUsers>>;
  } catch (err) {
    console.error('prefetchUsers failed', err);
    return [] as Awaited<ReturnType<typeof getUsers>>;
  }
};

const useGetUsers = (addresses?: string[]) => {
  return useQuery({
    queryFn: () => getUsers(addresses),
    queryKey: [...QUERY_KEY, ...(addresses || [])] as const
  });
};

export default useGetUsers;
