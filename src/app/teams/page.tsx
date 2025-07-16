import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { prefetchContributors } from '@/hooks/use-get-contributors';
import { TimeFilter } from '@/utils/github';

import BestPerformingTeams from '@/components/features/scoreboard/best-performing-teams';

export const metadata: Metadata = {
  title: 'Teams',
};

const TeamsPage = async () => {
  const queryClient = new QueryClient();

  await prefetchContributors(queryClient, { timeFilter: TimeFilter.ALL_TIME });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BestPerformingTeams />
    </HydrationBoundary>
  );
};

export default TeamsPage;
