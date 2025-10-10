import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import ProposalDetail from '@/features/govdao/proposal-detail';
import { prefetchProposal } from '@/hooks/use-get-proposal';
import LayoutContainer from '@/layouts/layout-container';
import { notFound } from 'next/navigation';
import { prefetchGovdaoMembers } from '@/hooks/use-get-govdao-members';

export const metadata: Metadata = {
  title: 'Proposal',
};

const Page = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const queryClient = new QueryClient();

  try {
    await prefetchProposal(queryClient, id);
  } catch (err: any) {
    if (err?.status === 404) return notFound();
    throw err;
  }

  await prefetchGovdaoMembers(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LayoutContainer>
        <ProposalDetail id={id} />
      </LayoutContainer>
    </HydrationBoundary>
  );
};

export default Page;
