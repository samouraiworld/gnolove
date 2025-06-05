import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { prefetchContributor } from '@/hooks/use-get-contributor';

import QueryClientWrapper from '@/wrapper/query-client';

import ContributorModal from '@/components/features/contributor/contributor-modal';

const ContributorPage = async ({ params }: { params: { login: string } }) => {
  const { login } = params;

  const queryClient = new QueryClient();

  await prefetchContributor(queryClient, { login });

  return (
    <QueryClientWrapper>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ContributorModal {...{ login }} />
      </HydrationBoundary>
    </QueryClientWrapper>
  );
};

export default ContributorPage;