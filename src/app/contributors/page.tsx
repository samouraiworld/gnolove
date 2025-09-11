import ContributorsList from '@/components/contributors/contributors-list';
import { QueryClient } from '@tanstack/react-query';
import LayoutContainer from '@/layouts/layout-container';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchContributors } from '@/hooks/use-get-contributors';
import { getIds } from '@/utils/array';
import { getSelectedRepositoriesFromSearchParam } from '@/utils/repositories';
import { TimeFilter, getTimeFilterFromSearchParam } from '@/utils/github';
import { prefetchRepositories } from '@/hooks/use-get-repositories';
import { prefetchScoreFactors } from '@/hooks/use-get-score-factors';

const Contributors = async ({ searchParams }: { searchParams: Promise<{ r?: string; f?: string }> }) => {
  const { r, f } = await searchParams;

  const queryClient = new QueryClient();

  const allRepositories = await prefetchRepositories(queryClient);
  const selectedRepositories = getSelectedRepositoriesFromSearchParam(r, allRepositories);

  const timeFilter = getTimeFilterFromSearchParam(f, TimeFilter.ALL_TIME);

  await Promise.all([
    prefetchContributors(queryClient, { timeFilter, repositories: getIds(selectedRepositories) }),
    prefetchScoreFactors(queryClient),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LayoutContainer>
        <ContributorsList />
      </LayoutContainer>
    </HydrationBoundary>
  );
};

export default Contributors;