import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { prefetchContributor } from '@/hooks/use-get-contributor';

import ContributorContent from '@/components/features/contributor/contributor-content';

export async function generateMetadata({ params }: { params: { login: string } }): Promise<Metadata> {
  const decodedLogin = decodeURIComponent(params.login);
  const match = decodedLogin.match(/^([^@]*)@([^@]+)$/);
  const formattedLogin = match ? match[2] : decodedLogin;

  return {
    title: `${formattedLogin} - Gnolove`,
  };
}

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
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContributorContent {...{ login: formattedLogin }} />
    </HydrationBoundary>
  );
};

export default ContributorPage;