import { Metadata } from 'next';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import ValidatorsClientPage from '@/features/validators/validators-client-page';

import LayoutContainer from '@/layouts/layout-container';

import { prefetchBlockHeight } from '@/hooks/use-get-blockHeight';
import { prefetchValidators } from '@/hooks/use-get-validators';
import { prefetchValidatorsLastIncident } from '@/hooks/use-get-validators-incident';
import { EValidatorPeriod } from '@/utils/validators';

export const metadata: Metadata = {
  title: 'Validators monitoring',
};

const Page = async () => {
  const queryClient = new QueryClient();

  await Promise.all([
    prefetchValidators(queryClient, EValidatorPeriod.MONTH),
    prefetchBlockHeight(queryClient),
    prefetchValidatorsLastIncident(queryClient),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LayoutContainer>
        <ValidatorsClientPage />
      </LayoutContainer>
    </HydrationBoundary>
  );
};

export default Page;
