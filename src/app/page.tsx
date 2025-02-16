import { Metadata } from 'next';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import ScoreboardPage from '@/feature/scoreboard-page';

import QueryClientWrapper from '@/wrapper/query-client';

import { prefetchContributors } from '@/hook/use-get-contributors';
import { prefetchLastIssues } from '@/hook/use-get-last-issues';
import { prefetchMilestone } from '@/hook/use-get-milestone';
import { prefetchNewContributors } from '@/hook/use-get-new-contributors';
import { prefetchRepositories } from '@/hook/use-get-repositories';

import { getIds } from '@/util/array';
import { getTimeFilterFromSearchParam, TimeFilter } from '@/util/github';
import { getSelectedRepositoriesFromSearchParam } from '@/util/repositories';

export const metadata: Metadata = {
  title: 'Top of Gnome',
};

export interface HomePageParams {
  searchParams: {
    f?: string | string[] | undefined;
    e?: string | string[] | undefined;
    r?: string | string[] | undefined;
  };
}

const debugTime = async <T,>(label: string, fn: (() => Promise<T>) | (() => Promise<T[]>)) => {
  console.time(label);
  const res = await fn();
  if (Array.isArray(res)) console.timeLog(label, `${res.length} records found`);
  console.timeEnd(label);

  return res;
};

const HomePage = async ({ searchParams: { f, e, r } }: HomePageParams) => {
  const timeFilter = getTimeFilterFromSearchParam(f, TimeFilter.MONTHLY);
  const exclude = !!e;

  const queryClient = new QueryClient();

  console.time('prefetchRepositories');
  const allRepositories = await prefetchRepositories(queryClient);
  console.timeEnd('prefetchRepositories');

  const selectedRepositories = getSelectedRepositoriesFromSearchParam(r, allRepositories);

  console.time('allPromises');
  await Promise.all([
    debugTime('prefetchMilestone', () => prefetchMilestone(queryClient)),
    debugTime('prefetchAllContributors', () => prefetchContributors(queryClient, { timeFilter: TimeFilter.ALL_TIME })),
    debugTime('prefetchContributors', () =>
      prefetchContributors(queryClient, { timeFilter, exclude, repositories: getIds(selectedRepositories) }),
    ),
    debugTime('prefetchLastIssues', () => prefetchLastIssues(queryClient)),
    debugTime('prefetchNewContributors', () => prefetchNewContributors(queryClient)),
  ]);
  console.timeEnd('allPromises');

  return (
    <QueryClientWrapper>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ScoreboardPage {...{ exclude, timeFilter, selectedRepositories }} />
      </HydrationBoundary>
    </QueryClientWrapper>
  );
};

export default HomePage;
