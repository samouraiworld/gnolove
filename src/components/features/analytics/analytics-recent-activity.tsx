'use client';

import { useMemo } from 'react';

import { MessageSquare, GitCommit, GitPullRequest } from 'lucide-react';
import { ArrowDownToLine } from 'lucide-react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';

import { TimeFilter, getChunkKeyByTimeFilter } from '@/utils/github';
import { TEnhancedUserWithStats } from '@/utils/schemas';

import CSVExportButton from '@/components/elements/csv-export-button';
import RechartTooltip from '@/components/elements/rechart-tooltip';

const fillColors = {
  commits: '#8884d8',
  issues: '#ffc658',
  prs: '#82ca9d',
};

type ActivityDataPoint = {
  date: string;
  commits: number;
  issues: number;
  prs: number;
};

type Props = {
  contributors: TEnhancedUserWithStats[];
  timeFilter: TimeFilter;
};

const renderActivityEntries = (payload: any[], _label?: string | number) => {
  if (!payload || !payload[0]) return null;
  const p = payload[0].payload as ActivityDataPoint;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <GitCommit className="h-4 w-4" />
        <span className="text-xs">Commits: </span>
        <span className="text-xs font-bold">{p.commits}</span>
      </div>
      <div className="flex items-center gap-1">
        <MessageSquare className="h-4 w-4" />
        <span className="text-xs">Issues: </span>
        <span className="text-xs font-bold">{p.issues}</span>
      </div>
      <div className="flex items-center gap-1">
        <GitPullRequest className="h-4 w-4" />
        <span className="text-xs">PRs: </span>
        <span className="text-xs font-bold">{p.prs}</span>
      </div>
    </div>
  );
};

const AnalyticsRecentActivity = ({ contributors, timeFilter }: Props) => {
  const data: ActivityDataPoint[] = useMemo(() => {
    const map = new Map<string, ActivityDataPoint>();

    contributors.forEach((c) => {
      c.commits?.forEach(({ createdAt }) => {
        const dateKey = getChunkKeyByTimeFilter(createdAt, timeFilter);
        if (!map.has(dateKey)) {
          map.set(dateKey, { date: dateKey, commits: 0, prs: 0, issues: 0 });
        }
        map.get(dateKey)!.commits++;
      });

      c.pullRequests?.forEach(({ createdAt }) => {
        const dateKey = getChunkKeyByTimeFilter(createdAt, timeFilter);
        if (!map.has(dateKey)) {
          map.set(dateKey, { date: dateKey, commits: 0, prs: 0, issues: 0 });
        }
        map.get(dateKey)!.prs++;
      });

      c.issues?.forEach(({ createdAt }) => {
        const dateKey = getChunkKeyByTimeFilter(createdAt, timeFilter);
        if (!map.has(dateKey)) {
          map.set(dateKey, { date: dateKey, commits: 0, prs: 0, issues: 0 });
        }
        map.get(dateKey)!.issues++;
      });
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [contributors, timeFilter]);

  const filename = useMemo(() => {
    const start = data[0]?.date || '';
    const end = data[data.length - 1]?.date || '';
    return `recent-activity_${start}_to_${end}`;
  }, [data]);

  return (
    <div className="h-[500px] w-full max-w-[650px] min-w-[350px] rounded-md border px-0 relative">
      <h2 className="py-3 text-center text-lg font-semibold">Recent activity</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 40, bottom: 20, left: -10 }}>
          <XAxis
            axisLine={false}
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickLine={false}
            tickMargin={10}
            minTickGap={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tickFormatter={(value) => Math.abs(value).toFixed(0).toString()}
          />
          <Tooltip
            offset={30}
            cursor={{ strokeDasharray: '3 3' }}
            content={
              <RechartTooltip
                renderEntries={renderActivityEntries}
                renderLabel={(_label: string | number | undefined, payload?: any[]) => {
                  const date = payload?.[0]?.payload?.date;
                  return date ? <span className="text-sm font-bold">{date}</span> : null;
                }}
              />
            }
          />
          <Bar maxBarSize={15} radius={[4, 4, 0, 0]} dataKey="commits" fill={fillColors.commits} />
          <Bar maxBarSize={15} radius={[4, 4, 0, 0]} dataKey="issues" fill={fillColors.issues} />
          <Bar maxBarSize={15} radius={[4, 4, 0, 0]} dataKey="prs" fill={fillColors.prs} />
        </BarChart>
      </ResponsiveContainer>
      <CSVExportButton className="absolute top-2 right-4" data={data} filename={filename}>
        <ArrowDownToLine size={20} />
      </CSVExportButton>
    </div>
  );
};

export default AnalyticsRecentActivity;
