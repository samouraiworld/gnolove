import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import AnalyticsClientPage from '@/components/features/analytics/analytics-client-page';
import { prefetchContributors } from '@/hooks/use-get-contributors';
import { TimeFilter } from '@/utils/github';

const AnalyticsPage = async () => {
  const queryClient = new QueryClient();

  await prefetchContributors(queryClient, { timeFilter: TimeFilter.ALL_TIME });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AnalyticsClientPage />
    </HydrationBoundary>
  );
};

export default AnalyticsPage;
