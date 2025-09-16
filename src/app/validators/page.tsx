import { Metadata } from 'next';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import ValidatorsClientPage from '@/features/validators/validators-client-page';

import LayoutContainer from '@/layouts/layout-container';

import { prefetchBlockHeight } from '@/hooks/use-get-blockHeight';
import { prefetchValidatorsMetrics } from '@/hooks/use-get-validators-metrics';

export const metadata: Metadata = {
  title: 'Validators monitoring',
};

const Page = async () => {
  const queryClient = new QueryClient();

  await Promise.all([prefetchValidatorsMetrics(queryClient), prefetchBlockHeight(queryClient)]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LayoutContainer>
        <ValidatorsClientPage />
      </LayoutContainer>
    </HydrationBoundary>
  );
};

export default Page;
