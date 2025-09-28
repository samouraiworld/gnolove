import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import ProposalDetail from '@/features/govdao/proposal-detail';
import { prefetchProposal } from '@/hooks/use-get-proposal';
import { prefetchUsers } from '@/hooks/use-get-users';
import LayoutContainer from '@/layouts/layout-container';
import { notFound } from 'next/navigation';
import { TProposal } from '@/utils/schemas';

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const queryClient = new QueryClient();

  let proposal: TProposal;
  try {
    proposal = await prefetchProposal(queryClient, id);
  } catch (err: any) {
    if (err?.status === 404) return notFound();
    throw err;
  }

  if (!proposal) return notFound();

  return {
    title: proposal.title,
    description: proposal.description,
  };
};

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const queryClient = new QueryClient();

  let proposal: TProposal;
  try {
    proposal = await prefetchProposal(queryClient, id);
  } catch (err: any) {
    if (err?.status === 404) return notFound();
    throw err;
  }

  if (!proposal) return notFound();

  await prefetchUsers(queryClient, proposal.votes.map((vote) => vote.address));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LayoutContainer>
        <ProposalDetail id={id} />
      </LayoutContainer>
    </HydrationBoundary>
  );
};

export default Page;
