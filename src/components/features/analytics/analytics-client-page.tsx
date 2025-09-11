'use client';

import { useMemo } from 'react';

import AnalyticsContributorLineChart from './analytics-contributor-line-chart';
import AnalyticsRecentActivity from './analytics-recent-activity';
import AnalyticsTopContributorBarChart from './analytics-top-contributor-bar-chart';

import LayoutContainer from '@/layouts/layout-container';

import useGetContributors from '@/hooks/use-get-contributors';
import useSelectedRepositories from '@/hooks/use-selected-repositories';
import useTimeFilter from '@/hooks/use-time-filter';

import { filterContributionsByRepo } from '@/utils/contributors';
import { TimeFilter } from '@/utils/github';

import AnalyticsTotalStats from '@/components/features/analytics/analytics-total-stats';
import { Separator } from '@/components/ui/separator';

const AnalyticsClientPage = () => {
  const timeFilter = useTimeFilter(TimeFilter.WEEKLY);
  const selectedRepositories = useSelectedRepositories();

  const { data: contributors } = useGetContributors({
    timeFilter,
    exclude: false,
    repositories: selectedRepositories,
  });

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
      <div className="my-5 w-full">
        <h1 className="text-2xl font-semibold">Contributors Analytics</h1>
        <Separator className="my-6" />
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:gap-0">
          <div className="flex items-end gap-4" />
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
