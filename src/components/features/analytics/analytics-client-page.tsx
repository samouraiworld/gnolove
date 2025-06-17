'use client';

import { useMemo, useState } from 'react';
import { Box, Flex, Heading, Separator } from '@radix-ui/themes';

import { subDays, parseISO, isAfter, isEqual } from 'date-fns';

import AnalyticsContributorLineChart from './analytics-contributor-line-chart';
import AnalyticsRecentActivity from './analytics-recent-activity';

import LayoutContainer from '@/layout/layout-container';

import { TimeFilter } from '@/util/github';

import AnalyticsTotalStats from '@/components/features/analytics/analytics-total-stats';
import ActivityTypeSelector, { ActivityType } from '@/components/modules/activity-type-selector';
import TimeRangeSelector from '@/components/modules/time-range-selector';
import useGetContributors from '@/hooks/use-get-contributors';

const AnalyticsClientPage = () => {
  const [startDate, setStartDate] = useState(subDays(new Date(), 14));
  const [activityType, setActivityType] = useState<ActivityType>('commits');

  const { data: contributors } = useGetContributors({ timeFilter: TimeFilter.ALL_TIME });

  const isAfterAndEqual = (date: string) => {
    const parsedDate = parseISO(date);
    return isAfter(parsedDate, startDate) || isEqual(parsedDate, startDate);
  };

  const filteredContributors = useMemo(() => {
    if (!contributors) return [];

    return contributors.map((contributor) => ({
      ...contributor,
      commits:
        contributor.commits?.filter(({ createdAt }) => isAfterAndEqual(createdAt)) ?? [],
      issues:
        contributor.issues?.filter(({ createdAt }) => isAfterAndEqual(createdAt)) ?? [],
      pullRequests:
        contributor.pullRequests?.filter(({ updatedAt }) => isAfterAndEqual(updatedAt)) ?? [],
    }));
  }, [contributors, startDate]);

  return (
    <LayoutContainer mt="5">
      <Box width="100%" my="5">
        <Heading>Contributors Analytics</Heading>
        <Separator size="4" my="6" />
        <Flex
          direction={{ initial: 'column', sm: 'row' }}
          gap={{ initial: '6', sm: '0' }}
          justify="between"
          align="center"
        >
          <Flex gap="4">
            <TimeRangeSelector onChange={setStartDate} />
            <ActivityTypeSelector onChange={setActivityType} />
          </Flex>
          <AnalyticsTotalStats contributors={filteredContributors} />
        </Flex>
        <Flex direction={{ initial: 'column', lg: 'row' }} justify="center" align="center" mt="6" gap="3">
          <AnalyticsContributorLineChart contributors={filteredContributors} type={activityType} />
          <AnalyticsRecentActivity contributors={filteredContributors} startDate={startDate} />
        </Flex>
      </Box>
    </LayoutContainer>
  );
};

export default AnalyticsClientPage;