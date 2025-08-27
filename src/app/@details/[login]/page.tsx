import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { prefetchContributor } from '@/hooks/use-get-contributor';

import ContributorContent from '@/components/features/contributor/contributor-content';
import { prefetchUserPackages } from '@/hooks/use-get-user-packages';
import { prefetchUserNamespaces } from '@/hooks/use-get-user-namespaces';
import { prefetchUserProposals } from '@/hooks/use-get-user-proposals';

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

  const contributor = await prefetchContributor(queryClient, formattedLogin);
  if (contributor && contributor.wallet) {
    await Promise.all([
      prefetchUserPackages(queryClient, contributor.wallet),
      prefetchUserNamespaces(queryClient, contributor.wallet),
      prefetchUserProposals(queryClient, contributor.wallet),
    ]);
  }
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContributorContent {...{ login: formattedLogin }} />
    </HydrationBoundary>
  );
};

export default ContributorPage;