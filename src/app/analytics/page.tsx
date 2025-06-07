import { Card, Flex, Heading, Text } from '@radix-ui/themes';

import LayoutContainer from '@/layout/layout-container';

import AnalyticsContributorMap from '@/components/features/analytics/analytics-contributor-map';

const AnalyticsPage = () => {
  return (
    <LayoutContainer mt="5">
      <Heading>Contributors Analytics (WIP)</Heading>
      <Flex flexGrow="1" justify="center" align="center" mt="6">
        <Text>[ Graph coming soon ]</Text>
        {/* <AnalyticsContributorMap /> */}
      </Flex>
    </LayoutContainer>
  );
};

export default AnalyticsPage;
