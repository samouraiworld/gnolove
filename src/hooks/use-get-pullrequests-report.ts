import { QueryClient, useQuery } from '@tanstack/react-query';

import { getPullrequestsReportByDate } from '@/app/actions';

export const QUERY_KEY = ['pullrequests-report'];

export interface UseGetPullRequestsReportParams {
  startDate: Date;
  endDate: Date;
}

export const prefetchPullRequestsReport = async (queryClient: QueryClient, params: UseGetPullRequestsReportParams) => {
  try {
    const startIso = params.startDate.toISOString();
    const endIso = params.endDate.toISOString();
    const queryKey = [...QUERY_KEY, startIso, endIso] as const;
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => getPullrequestsReportByDate(params.startDate, params.endDate),
    });
    return queryClient.getQueryData(queryKey) as Awaited<ReturnType<typeof getPullrequestsReportByDate>>;
  } catch (err) {
    console.error('prefetchPullRequestsReport failed', err);
    return undefined as unknown as Awaited<ReturnType<typeof getPullrequestsReportByDate>>;
  }
};

const useGetPullRequestsReport = (params: UseGetPullRequestsReportParams) => {
  const startIso = params.startDate.toISOString();
  const endIso = params.endDate.toISOString();
  return useQuery({
    queryFn: () => getPullrequestsReportByDate(params.startDate, params.endDate),
    queryKey: [...QUERY_KEY, startIso, endIso],
  });
};

export default useGetPullRequestsReport;
