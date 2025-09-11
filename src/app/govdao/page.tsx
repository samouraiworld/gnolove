import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import GovdaoPage from '@/features/govdao/govdao-page';
import { prefetchProposals } from '@/hooks/use-get-proposals';
import LayoutContainer from '@/layouts/layout-container';

export const metadata: Metadata = {
  title: 'Governance DAO',
};

const Page = async () => {
  const queryClient = new QueryClient();
  await prefetchProposals(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LayoutContainer>
        <GovdaoPage />
      </LayoutContainer>
    </HydrationBoundary>
  );
};

export default Page;
