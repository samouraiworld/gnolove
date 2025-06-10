'use client';

import { useMemo, useState } from 'react';

import AnalyticsContributorLineChart from './analytics-contributor-line-chart';
import AnalyticsRecentActivity from './analytics-recent-activity';
import { Box, Flex, Heading, Separator } from '@radix-ui/themes';
import dayjs from 'dayjs';

import LayoutContainer from '@/layout/layout-container';

import { TimeFilter } from '@/util/github';

import AnalyticsTotalStats from '@/components/features/analytics/analytics-total-stats';
import ActivityTypeSelector, { ActivityType } from '@/components/modules/activity-type-selector';
import TimeRangeSelector from '@/components/modules/time-range-selector';
import useGetContributors from '@/hooks/use-get-contributors';

const AnalyticsClientPage = () => {
  const [filter, setFilter] = useState<TimeFilter>(TimeFilter.ALL_TIME);
  const [startDate, setStartDate] = useState(dayjs().subtract(14, 'day').toDate());
  const [activityType, setActivityType] = useState<ActivityType>('commits');

  let { data: contributors } = useGetContributors({ timeFilter: filter });

  const filteredContributors = useMemo(() => {
    if (!contributors) return [];

    return contributors.map((contributor) => ({
      ...contributor,
      commits:
        contributor.commits?.filter(
          ({ createdAt }) => dayjs(createdAt).isAfter(startDate) || dayjs(createdAt).isSame(startDate),
        ) ?? [],
      issues:
        contributor.issues?.filter(
          ({ createdAt }) => dayjs(createdAt).isAfter(startDate) || dayjs(createdAt).isSame(startDate),
        ) ?? [],
      pullRequests:
        contributor.pullRequests?.filter(
          ({ updatedAt }) => dayjs(updatedAt).isAfter(startDate) || dayjs(updatedAt).isSame(startDate),
        ) ?? [],
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
