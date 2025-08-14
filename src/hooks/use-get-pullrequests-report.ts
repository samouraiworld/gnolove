import { QueryClient, useQuery } from '@tanstack/react-query';
import { getPullrequestsReportByDate } from '@/app/actions';

export const QUERY_KEY = ['pullrequests-report'];

export interface UseGetPullRequestsReportParams {
  startDate: Date;
  endDate: Date;
}

export const prefetchPullRequestsReport = async (queryClient: QueryClient, params: UseGetPullRequestsReportParams) => {
  const report = await getPullrequestsReportByDate(params.startDate, params.endDate);
  queryClient.setQueryData([...QUERY_KEY, params], report);
  return report;
};

const useGetPullRequestsReport = (params: UseGetPullRequestsReportParams) => {
  return useQuery({
    queryFn: () => getPullrequestsReportByDate(params.startDate, params.endDate),
    queryKey: [...QUERY_KEY, params],
  });
};

export default useGetPullRequestsReport;
