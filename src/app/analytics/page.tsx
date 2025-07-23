import { Metadata } from 'next';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import AnalyticsClientPage from '@/components/features/analytics/analytics-client-page';
import { prefetchContributors } from '@/hooks/use-get-contributors';
import { prefetchRepositories } from '@/hooks/use-get-repositories';
import { getIds } from '@/utils/array';
import { getTimeFilterFromSearchParam, TimeFilter } from '@/utils/github';
import { getSelectedRepositoriesFromSearchParam } from '@/utils/repositories';
import { SearchParamsFilters } from '@/types/url-filters';

export const metadata: Metadata = {
  title: 'Analytics',
};

const AnalyticsPage = async ({ searchParams: { f, e, r } }: SearchParamsFilters) => {
  const timeFilter = getTimeFilterFromSearchParam(f, TimeFilter.ALL_TIME);
  const exclude = !!e;
  const queryClient = new QueryClient();

  const allRepositories = await prefetchRepositories(queryClient);

  const selectedRepositories = getSelectedRepositoriesFromSearchParam(r, allRepositories);

  await Promise.all([
    prefetchContributors(queryClient, { timeFilter: TimeFilter.ALL_TIME }),
    prefetchContributors(queryClient, { timeFilter, exclude, repositories: getIds(selectedRepositories) }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AnalyticsClientPage />
    </HydrationBoundary>
  );
};

export default AnalyticsPage;
