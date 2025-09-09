import ContributorsList from '@/components/contributors/contributors-list';
import { QueryClient } from '@tanstack/react-query';
import LayoutContainer from '@/layouts/layout-container';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchContributors } from '@/hooks/use-get-contributors';
import { getIds } from '@/utils/array';
import { getSelectedRepositoriesFromSearchParam } from '@/utils/repositories';
import { TimeFilter } from '@/utils/github';
import { prefetchRepositories } from '@/hooks/use-get-repositories';

const Contributors = async ({ searchParams }: { searchParams: Promise<{ r: string }> }) => {
  const { r } = await searchParams;

  const queryClient = new QueryClient();

  const allRepositories = await prefetchRepositories(queryClient);
  const selectedRepositories = getSelectedRepositoriesFromSearchParam(r, allRepositories);

  await prefetchContributors(queryClient, { timeFilter: TimeFilter.ALL_TIME, repositories: getIds(selectedRepositories) });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LayoutContainer>
        <ContributorsList />
      </LayoutContainer>
    </HydrationBoundary>
  );
};

export default Contributors;