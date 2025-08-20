import { QueryClient, useQuery } from '@tanstack/react-query';
import { getPullrequestsReportByDate } from '@/app/actions';

export const QUERY_KEY = ['pullrequests-report'];

export interface UseGetPullRequestsReportParams {
  startDate: Date;
  endDate: Date;
}

export const prefetchPullRequestsReport = async (queryClient: QueryClient, params: UseGetPullRequestsReportParams) => {
  const report = await getPullrequestsReportByDate(params.startDate, params.endDate);
  const startIso = params.startDate.toISOString();
  const endIso = params.endDate.toISOString();
  queryClient.setQueryData([...QUERY_KEY, startIso, endIso], report);
  return report;
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
