'use client';

import { useMemo, useState } from 'react';

import AnalyticsContributorLineChart from './analytics-contributor-line-chart';
import AnalyticsRecentActivity from './analytics-recent-activity';
import AnalyticsTopContributorBarChart from './analytics-top-contributor-bar-chart';
import { Separator } from '@/components/ui/separator';

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
    <LayoutContainer className="mt-5">
      <div className="w-full my-5">
        <h1 className="text-2xl font-semibold">Contributors Analytics</h1>
        <Separator className="my-6" />
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:gap-0">
          <div className="flex items-end gap-4">
            <TimeRangeSelector onDateChange={setTimeFilter} defaultValue={timeFilter} className="mb-3" />
            <RepositoriesSelector
              repositories={repositories}
              selectedRepositories={selectedRepositories}
              onSelectedRepositoriesChange={setSelectedRepositories}
              className="mb-3"
            />
          </div>
          <AnalyticsTotalStats contributors={filteredContributors} />
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <AnalyticsTopContributorBarChart
            contributors={filteredContributors}
            selectedRepositories={selectedRepositories}
          />
          <div className="mt-6 flex flex-col items-center justify-center gap-3 lg:flex-row">
            <AnalyticsContributorLineChart contributors={filteredContributors} timeFilter={timeFilter} />
            <AnalyticsRecentActivity contributors={filteredContributors} timeFilter={timeFilter} />
          </div>
        </div>
      </div>
    </LayoutContainer>
  );
};

export default AnalyticsClientPage;
