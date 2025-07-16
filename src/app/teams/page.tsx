import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { prefetchContributors } from '@/hooks/use-get-contributors';
import { TimeFilter } from '@/utils/github';
import dynamic from 'next/dynamic';

const BestPerformingTeams = dynamic(() => import('@/components/features/scoreboard/best-performing-teams'), { ssr: false });

export const metadata: Metadata = {
  title: 'Teams',
};

const TeamsPage = async () => {
  const queryClient = new QueryClient();

  await prefetchContributors(queryClient, { timeFilter: TimeFilter.MONTHLY });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BestPerformingTeams />
    </HydrationBoundary>
  );
};

export default TeamsPage;
