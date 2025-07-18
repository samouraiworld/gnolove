'use client';

import { useMemo, useState } from 'react';

import AnalyticsContributorLineChart from './analytics-contributor-line-chart';
import AnalyticsRecentActivity from './analytics-recent-activity';
import AnalyticsTopContributorBarChart from './analytics-top-contributor-bar-chart';
import { Box, Flex, Heading, Separator } from '@radix-ui/themes';
import { subDays, parseISO, isAfter, isEqual } from 'date-fns';

import LayoutContainer from '@/layout/layout-container';

import { TimeFilter } from '@/util/github';

import AnalyticsTotalStats from '@/components/features/analytics/analytics-total-stats';
import RepositoriesSelector from '@/components/modules/repositories-selector';
import TimeRangeSelector from '@/components/modules/time-range-selector';
import useGetContributors from '@/hooks/use-get-contributors';
import useGetRepositories from '@/hooks/use-get-repositories';

const AnalyticsClientPage = () => {
  const [startDate, setStartDate] = useState(subDays(new Date(), 14));

  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
  const { data: contributors } = useGetContributors({
    timeFilter: TimeFilter.ALL_TIME,
    exclude: false,
    repositories: selectedRepositories,
  });

  const { data: repositories = [] } = useGetRepositories();

  const isAfterAndEqual = (date: string) => {
    const parsedDate = parseISO(date);
    return isAfter(parsedDate, startDate) || isEqual(parsedDate, startDate);
  };

  const filteredContributors = useMemo(() => {
    if (!contributors) return [];

    return contributors.map((contributor) => ({
      ...contributor,
      commits:
        contributor.commits?.filter(
          ({ createdAt, url }) =>
            isAfterAndEqual(createdAt) &&
            (selectedRepositories.length ? selectedRepositories.some((repo) => url.includes(repo)) : true),
        ) ?? [],
      issues:
        contributor.issues?.filter(
          ({ createdAt, url }) =>
            isAfterAndEqual(createdAt) &&
            (selectedRepositories.length ? selectedRepositories.some((repo) => url.includes(repo)) : true),
        ) ?? [],
      pullRequests:
        contributor.pullRequests?.filter(
          ({ updatedAt, url }) =>
            isAfterAndEqual(updatedAt) &&
            (selectedRepositories.length ? selectedRepositories.some((repo) => url.includes(repo)) : true),
        ) ?? [],
    }));
  }, [contributors, startDate, selectedRepositories]);

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
          <Flex gap="4" align="end">
            <TimeRangeSelector onDateChange={setStartDate} mb="3" />
            <RepositoriesSelector
              repositories={repositories}
              selectedRepositories={selectedRepositories}
              onSelectedRepositoriesChange={setSelectedRepositories}
              defaultCheckedIds={['gnolang/gno']}
              mb="3"
            />
          </Flex>
          <AnalyticsTotalStats contributors={filteredContributors} />
        </Flex>
        <Flex direction={{ initial: 'column' }} mt="6" gap="3">
          <AnalyticsTopContributorBarChart
            contributors={filteredContributors}
            selectedRepositories={selectedRepositories}
          />
          <Flex direction={{ initial: 'column', lg: 'row' }} justify="center" align="center" mt="6" gap="3">
            <AnalyticsContributorLineChart contributors={filteredContributors} />
            <AnalyticsRecentActivity contributors={filteredContributors} startDate={startDate} />
          </Flex>
        </Flex>
      </Box>
    </LayoutContainer>
  );
};

export default AnalyticsClientPage;
