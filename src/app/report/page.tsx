import { Metadata } from 'next';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { endOfWeek, subWeeks } from 'date-fns';

import ReportClientPage from '@/features/report/report-client-page';

import { prefetchPullRequestsReport } from '@/hooks/use-get-pullrequests-report';
import { prefetchRepositories } from '@/hooks/use-get-repositories';

import { SearchParamsFilters } from '@/types/url-filters';

export const metadata: Metadata = {
  title: 'Weekly reports',
};

const ReportPage = async ({ searchParams: { f, e, r } }: SearchParamsFilters) => {
  const queryClient = new QueryClient();
  const startDate = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 });
  const endDate = endOfWeek(new Date(), { weekStartsOn: 0 });

  await Promise.all([
    prefetchRepositories(queryClient),
    prefetchPullRequestsReport(queryClient, { startDate, endDate }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReportClientPage />
    </HydrationBoundary>
  );
};

export default ReportPage;
