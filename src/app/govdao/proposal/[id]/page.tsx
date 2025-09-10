import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import ProposalDetail from '@/features/govdao/proposal-detail';
import { prefetchProposal } from '@/hooks/use-get-proposal';
import LayoutContainer from '@/layouts/layout-container';

export const metadata: Metadata = {
  title: 'Proposal',
};

const Page = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const queryClient = new QueryClient();
  await prefetchProposal(queryClient, id);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LayoutContainer>
        <ProposalDetail id={id} />
      </LayoutContainer>
    </HydrationBoundary>
  );
};

export default Page;
