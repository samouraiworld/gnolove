'use client';

import { useMemo } from 'react';
import React from 'react';

import ContributionsHeatmap from './contributions-heatmap';
import { ArrowDownToLine } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { TContributor, TContributorRepository, TTimeCount, TTopContributedRepo } from '@/utils/schemas';

import CSVExportButton from '@/components/elements/csv-export-button';
import RechartTooltip from '@/components/elements/rechart-tooltip';

const ContributorAnalytics = ({ contributor }: { contributor: TContributor }) => {
  const monthlyActivityData = useMemo(() => {
    // Merge monthly data from commits, PRs, and issues into one array by period
    const commits = contributor.commitsPerMonth || [];
    const prs = contributor.pullRequestsPerMonth || [];
    const issues = contributor.issuesPerMonth || [];
    // Create a map of period -> { commits, prs, issues }
    const monthlyMap: Record<string, { commits: number; prs: number; issues: number }> = {};
    commits.forEach(({ period, count }) => {
      if (!monthlyMap[period]) monthlyMap[period] = { commits: 0, prs: 0, issues: 0 };
      monthlyMap[period].commits = count;
    });
    prs.forEach(({ period, count }) => {
      if (!monthlyMap[period]) monthlyMap[period] = { commits: 0, prs: 0, issues: 0 };
      monthlyMap[period].prs = count;
    });
    issues.forEach(({ period, count }) => {
      if (!monthlyMap[period]) monthlyMap[period] = { commits: 0, prs: 0, issues: 0 };
      monthlyMap[period].issues = count;
    });
    // Convert to array sorted by period ascending
    return Object.entries(monthlyMap)
      .map(([period, vals]) => ({ period, ...vals }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [contributor.commitsPerMonth, contributor.pullRequestsPerMonth, contributor.issuesPerMonth]);
  const monthlyActivityFilename = useMemo(() => {
    const start = monthlyActivityData[0]?.period || '';
    const end = monthlyActivityData[monthlyActivityData.length - 1]?.period || '';
    return `monthly-activity-trend_${contributor.name || contributor.login}_${start}_to_${end}`.replace(/\s+/g, '-');
  }, [monthlyActivityData, contributor.name || contributor.login]);

  const repositoryData = (contributor.topContributedRepositories || []).map(
    ({ id, contributions }: TTopContributedRepo) => ({
      name: id,
      contributions,
    }),
  );

  const contributionTypeData = [
    { name: 'Commits', value: contributor.totalCommits || 0, color: '#8884d8' },
    { name: 'Pull Requests', value: contributor.totalPullRequests || 0, color: '#82ca9d' },
    { name: 'Issues', value: contributor.totalIssues || 0, color: '#ffc658' },
  ];

  const languageColorMap: Record<string, string> = {
    Go: '#00ADD8',
    Gno: '#7C3AED',
    JavaScript: '#F7DF1E',
    TypeScript: '#3178C6',
    Rust: '#dea584',
    Python: '#3572A5',
    C: '#555',
    Cpp: '#f34b7d',
    Other: '#8884d8',
  };

  const languageData = useMemo(() => {
    const languageCounts: Record<string, number> = {};
    (contributor.topRepositories || []).forEach((repo: TContributorRepository) => {
      const lang = repo.primaryLanguage || 'Other';
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });
    const totalLang = Object.values(languageCounts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(languageCounts).map(([name, count]) => ({
      name,
      value: Math.round((count / totalLang) * 100),
      color: languageColorMap[name] || '#8884d8',
    }));
  }, [contributor.topRepositories]);

  const heatmapData = useMemo(() => {
    return Array.isArray(contributor.contributionsPerDay)
      ? contributor.contributionsPerDay.map((day: TTimeCount) => ({
        date: day.period,
        contributions: day.count,
      }))
      : [];
  }, [contributor.contributionsPerDay]);

  return (
    <div className="h-full rounded-md border">
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <div className="relative min-h-[260px] rounded-md border p-3">
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Contribution Activity</h3>
            <p className="text-muted-foreground text-sm">Daily contributions over the past year</p>
            <ContributionsHeatmap data={heatmapData} />
          </div>
          <CSVExportButton
            className="absolute top-2 right-2"
            data={heatmapData}
            filename={`yearly-contributions-${contributor.name || contributor.login}`}
          >
            <ArrowDownToLine size={20} />
          </CSVExportButton>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Repository Contributions Bar Chart */}
          {repositoryData.length > 0 && (
            <div className="relative rounded-md border p-3">
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Contributions by Repository</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={repositoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-6)" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                        stroke="var(--gray-11)"
                      />
                      <YAxis fontSize={12} stroke="var(--gray-11)" />
                      <Tooltip content={<RechartTooltip />} />
                      <Bar dataKey="contributions" fill="var(--accent-9)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <CSVExportButton
                className="absolute top-2 right-2"
                data={repositoryData}
                filename={`repository-contributions-${contributor.name || contributor.login}`}
              >
                <ArrowDownToLine size={20} />
              </CSVExportButton>
            </div>
          )}
          {/* Contribution Types Donut Chart */}
          <div className="relative rounded-md border p-3">
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">Contribution Types</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contributionTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {contributionTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<RechartTooltip />} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <CSVExportButton
                className="absolute top-2 right-2"
                data={contributionTypeData}
                filename={`contribution-types-${contributor.name || contributor.login}`}
              >
                <ArrowDownToLine size={20} />
              </CSVExportButton>
            </div>
          </div>

          {/* Language Distribution */}
          {languageData.length > 0 && (
            <div className="relative rounded-md border p-3">
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Programming Languages</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={languageData} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                        {languageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<RechartTooltip />} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <CSVExportButton
                className="absolute top-2 right-2"
                data={languageData}
                filename={`language-distribution-${contributor.name || contributor.login}`}
              >
                <ArrowDownToLine size={20} />
              </CSVExportButton>
            </div>
          )}

          {/* Monthly Activity Trend */}
          <div className="relative rounded-md border p-3">
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">Monthly Activity Trend</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyActivityData} margin={{ top: 20, right: 30, left: -30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-6)" />
                    <XAxis dataKey="period" fontSize={12} stroke="var(--gray-11)" />
                    <YAxis fontSize={12} stroke="var(--gray-11)" />
                    <Tooltip content={<RechartTooltip />} />
                    <Bar dataKey="commits" fill="#8884d8" name="Commits" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="prs" fill="#82ca9d" name="PRs" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="issues" fill="#ffc658" name="Issues" radius={[4, 4, 0, 0]} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <CSVExportButton
                className="absolute top-2 right-2"
                data={monthlyActivityData}
                filename={monthlyActivityFilename}
              >
                <ArrowDownToLine size={20} />
              </CSVExportButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributorAnalytics;
