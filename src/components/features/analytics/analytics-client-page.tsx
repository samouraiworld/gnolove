'use client';

import { useMemo, useState } from 'react';

import AnalyticsContributorLineChart from './analytics-contributor-line-chart';
import AnalyticsRecentActivity from './analytics-recent-activity';
import AnalyticsTopContributorBarChart from './analytics-top-contributor-bar-chart';
import { Box, Flex, Heading, Separator } from '@radix-ui/themes';

import LayoutContainer from '@/layouts/layout-container';

import useGetContributors from '@/hooks/use-get-contributors';
import useGetRepositories from '@/hooks/use-get-repositories';

import { filterContributionsByRepo } from '@/utils/contributors';
import { TimeFilter } from '@/utils/github';

import AnalyticsTotalStats from '@/components/features/analytics/analytics-total-stats';
import RepositoriesSelector from '@/components/modules/repositories-selector';
import TimeRangeSelector from '@/components/modules/time-range-selector';

const AnalyticsClientPage = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(TimeFilter.WEEKLY);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(['gnolang/gno']);

  const { data: contributors } = useGetContributors({
    timeFilter,
    exclude: false,
    repositories: selectedRepositories,
  });
  const { data: repositories = [] } = useGetRepositories();

  const filteredContributors = useMemo(() => {
    if (!contributors) return [];
    return contributors.map((contributor) => ({
      ...contributor,
      commits: filterContributionsByRepo(contributor.commits, selectedRepositories),
      issues: filterContributionsByRepo(contributor.issues, selectedRepositories),
      pullRequests: filterContributionsByRepo(contributor.pullRequests, selectedRepositories),
    }));
  }, [contributors, timeFilter, selectedRepositories]);

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
            <TimeRangeSelector onDateChange={setTimeFilter} defaultValue={timeFilter} mb="3" />
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
            <AnalyticsRecentActivity contributors={filteredContributors} timeFilter={timeFilter} />
          </Flex>
        </Flex>
      </Box>
    </LayoutContainer>
  );
};

export default AnalyticsClientPage;
