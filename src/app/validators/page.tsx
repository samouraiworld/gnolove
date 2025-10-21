import { Metadata } from 'next';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import ValidatorsClientPage from '@/features/validators/validators-client-page';

import LayoutContainer from '@/layouts/layout-container';

import { prefetchBlockHeight } from '@/hooks/use-get-blockHeight';
import { prefetchValidators } from '@/hooks/use-get-validators';
import { prefetchValidatorsLastIncident } from '@/hooks/use-get-validators-incident';
import { EValidatorPeriod } from '@/utils/validators';
import { prefetchValidatorUptime } from '@/hooks/use-get-uptime';
import { prefetchValidatorTxContrib } from '@/hooks/use-get-tx-contrib';
import { prefetchValidatorsMissingBlock } from '@/hooks/use-get-missing-block';

export const metadata: Metadata = {
  title: 'Validators monitoring',
};

const Page = async () => {
  const queryClient = new QueryClient();

  await Promise.all([
    prefetchValidators(queryClient, EValidatorPeriod.MONTH),
    prefetchBlockHeight(queryClient),
    prefetchValidatorsLastIncident(queryClient, EValidatorPeriod.MONTH),
    prefetchValidatorUptime(queryClient),
    prefetchValidatorTxContrib(queryClient, EValidatorPeriod.MONTH),
    prefetchValidatorsMissingBlock(queryClient, EValidatorPeriod.MONTH),
  ]);

  return (
    <LayoutContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ValidatorsClientPage />
      </HydrationBoundary>
    </LayoutContainer>
  );
};

export default Page;
