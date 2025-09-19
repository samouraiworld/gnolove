import { Box, Heading, Text } from '@radix-ui/themes';
import { auth } from '@clerk/nextjs/server';
import WebhooksSectionClient from '@/features/settings/webhooks-section';
import LayoutContainer from '@/layouts/layout-container';
import { Metadata } from 'next';
import { TMonitoringWebhookKind } from '@/utils/schemas';
import { prefetchMonitoringWebhooks } from '@/hooks/use-monitoring-webhooks';
import { prefetchReportHour } from '@/hooks/use-monitoring-webhooks';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export const metadata: Metadata = {
  title: 'Account settings',
};

const kinds: TMonitoringWebhookKind[] = ['govdao', 'validator'];

export default async function SettingsPage() {
  const { userId } = auth();

  if (!userId) {
    return (
      <Box p="5" pt="9">
        <Heading size="6" mb="3">
          Settings
        </Heading>
        <Text>Please sign in to configure your monitoring.</Text>
      </Box>
    );
  }

  const queryClient = new QueryClient();

  await Promise.all([...kinds.map((k) => prefetchMonitoringWebhooks(queryClient, k)), prefetchReportHour(queryClient)]);

  return (
    <LayoutContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Box pt="9">
          <Heading size="6">Settings</Heading>

          {kinds.map((k) => (
            <WebhooksSectionClient key={k} kind={k} />
          ))}
        </Box>
      </HydrationBoundary>
    </LayoutContainer>
  );
}
