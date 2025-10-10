import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import GovdaoPage from '@/features/govdao/govdao-page';
import { prefetchProposals } from '@/hooks/use-get-proposals';
import { prefetchGovdaoMembers } from '@/hooks/use-get-govdao-members';
import LayoutContainer from '@/layouts/layout-container';

export const metadata: Metadata = {
  title: 'Governance DAO',
};

const Page = async () => {
  const queryClient = new QueryClient();
  
  await Promise.all([
    prefetchProposals(queryClient),
    prefetchGovdaoMembers(queryClient),
  ]);

  return (
    <LayoutContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <GovdaoPage />
      </HydrationBoundary>
    </LayoutContainer>
  );
};

export default Page;
