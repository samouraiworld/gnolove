import { Metadata } from 'next';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { endOfWeek, startOfWeek, format, setWeek } from 'date-fns';

import ReportClientPage from '@/features/report/report-client-page';

import { prefetchPullRequestsReport } from '@/hooks/use-get-pullrequests-report';
import { prefetchRepositories } from '@/hooks/use-get-repositories';
import LayoutContainer from '@/layouts/layout-container';

export async function generateMetadata({ searchParams }: { searchParams?: { week?: string } }): Promise<Metadata> {
  const now = new Date();
  const weekParam = Number(searchParams?.week);
  const refDate =
    !Number.isNaN(weekParam) && weekParam >= 1 && weekParam <= 53
      ? setWeek(now, weekParam, { weekStartsOn: 0, firstWeekContainsDate: 1 })
      : now;
  const start = startOfWeek(refDate, { weekStartsOn: 0 });
  const end = endOfWeek(refDate, { weekStartsOn: 0 });

  const startLabel = format(start, 'MMM d');
  const endLabel = format(end, 'MMM d, yyyy');

  return {
    title: `Weekly reports — ${startLabel} – ${endLabel}`,
  };
}

const ReportPage = async ({ searchParams }: { searchParams?: { week?: string } }) => {
  const queryClient = new QueryClient();
  const now = new Date();
  const weekParam = Number(searchParams?.week);
  const refDate =
    !Number.isNaN(weekParam) && weekParam >= 1 && weekParam <= 53
      ? setWeek(now, weekParam, { weekStartsOn: 0, firstWeekContainsDate: 1 })
      : now;
  const endDate = endOfWeek(refDate, { weekStartsOn: 0 });
  const startDate = startOfWeek(refDate, { weekStartsOn: 0 });

  await Promise.all([
    prefetchRepositories(queryClient),
    prefetchPullRequestsReport(queryClient, { startDate, endDate }),
  ]);

  return (
    <LayoutContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ReportClientPage />
      </HydrationBoundary>
    </LayoutContainer>
  );
};

export default ReportPage;
