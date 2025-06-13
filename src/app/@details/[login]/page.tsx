import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { prefetchContributor } from '@/hooks/use-get-contributor';

import QueryClientWrapper from '@/wrapper/query-client';

import ContributorModal from '@/components/features/contributor/contributor-modal';

const ContributorPage = async ({ params }: { params: { login: string } }) => {
  const { login } = params;
  const decodedLogin = decodeURIComponent(login);
  const match = decodedLogin.match(/^([^@]*)@([^@]+)$/);
  if (!match) {
    throw new Error('Invalid login: must contain exactly one "@".');
  }
  const formattedLogin = match[2];

  const queryClient = new QueryClient();

  await prefetchContributor(queryClient, formattedLogin);

  return (
    <QueryClientWrapper>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ContributorModal {...{ login: formattedLogin }} />
      </HydrationBoundary>
    </QueryClientWrapper>
  );
};

export default ContributorPage;