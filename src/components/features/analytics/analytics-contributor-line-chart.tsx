'use client';

import { ReactElement, useMemo, useState } from 'react';

import { Avatar, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { format, parseISO, compareAsc } from 'date-fns';
import { ArrowDownToLine } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Customized, CustomizedProps } from 'recharts';

import CSVExportButton from '@/components/elements/csv-export-button';
import RechartTooltip from '@/components/elements/rechart-tooltip';
import ActivityTypeSelector, { ActivityType } from '@/components/modules/activity-type-selector';
import { TEnhancedUserWithStats } from '@/utils/schemas';
import { getChunkKeyByTimeFilter, TimeFilter } from '@/utils/github';

const labelMap: Record<ActivityType, string> = {
  commits: 'Commits',
  pullRequests: 'Pull Requests',
  issues: 'Issues',
};

type ContributorDataLinePoint = {
  date: string;
  [login: string]: number | string;
};

type Props = {
  contributors: TEnhancedUserWithStats[];
  timeFilter: TimeFilter;
};

interface Entry {
  color: string;
  name: string;
  value: number;
}

const AnalyticsContributorLineChart = ({ contributors, timeFilter }: Props) => {
  const [activityType, setActivityType] = useState<ActivityType>('commits');

  const contributorFiltered = useMemo(
    () => contributors.filter((c) => (c[activityType]?.length || 0) > 0).slice(0, 16),
    [contributors, activityType],
  );

  const { data, avatarData } = useMemo(() => {
    const countByDate: Record<string, Record<string, number>> = {};

    for (const c of contributorFiltered) {
      const list = c[activityType] || [];
      for (const item of list) {
        const rawDate = item.createdAt;
        const parsed = parseISO(rawDate);
        const chunkKey = getChunkKeyByTimeFilter(parsed, timeFilter);

        if (!countByDate[chunkKey]) countByDate[chunkKey] = {};
        countByDate[chunkKey][c.login] = (countByDate[chunkKey][c.login] || 0) + 1;
      }
    }

    const datesSorted = Object.keys(countByDate).sort((a, b) => compareAsc(parseISO(a), parseISO(b)));
    const contributorLogins = contributorFiltered.map((c) => c.login);

    const cumulativeData: Record<string, number> = {};
    const cumulativeAvatar: Record<string, number> = {};

    const data: ContributorDataLinePoint[] = [];
    const avatarData: ContributorDataLinePoint[] = [];

    for (const date of datesSorted) {
      const rowData: ContributorDataLinePoint = { date };
      const rowAvatar: ContributorDataLinePoint = { date };
      const dailyContributors = countByDate[date] || {};

      // All login even for days without activities
      for (const login of contributorLogins) {
        const daily = dailyContributors[login] || 0;
        cumulativeData[login] = (cumulativeData[login] || 0) + daily;
        rowData[login] = cumulativeData[login];
      }

      // Only login with activities per day
      for (const login of Object.keys(dailyContributors)) {
        const daily = dailyContributors[login];
        cumulativeAvatar[login] = (cumulativeAvatar[login] || 0) + daily;
        rowAvatar[login] = cumulativeAvatar[login];
      }

      data.push(rowData);
      avatarData.push(rowAvatar);
    }

    return {
      data,
      avatarData,
    };
  }, [contributorFiltered, activityType]);

  const contributorLogins = useMemo(() => contributorFiltered.map((c) => c.login), [contributorFiltered]);

  const AvatarRenderer: React.FC<CustomizedProps<any, ReactElement>> = ({ xAxisMap = {}, yAxisMap = {} }) => {
    const xAxis: any = Object.values(xAxisMap)[0];
    const yAxis: any = Object.values(yAxisMap)[0];
    if (!xAxis || !yAxis) return null;

    const scaleX = typeof xAxis?.scale === 'function' ? xAxis.scale : () => 0;
    const scaleY = typeof yAxis?.scale === 'function' ? yAxis.scale : () => 0;

    const positionMap = new Map<string, number>();

    return (
      <>
        {contributorFiltered.map((c, i) => {
          const login = c.login;
          const avatarUrl = c.avatarUrl;
          const lastEntry = [...avatarData].reverse().find((d: any) => d[login] !== undefined);
          if (!lastEntry) return null;

          const x = scaleX(lastEntry.date);
          const y = scaleY(lastEntry[login]);

          const yKey = Math.round(y);
          const positionKey = `${yKey}`;

          const offset = ((positionMap.get(positionKey) ?? 0) - 1) * 15;
          positionMap.set(positionKey, (positionMap.get(positionKey) || 0) + 1);

          return (
            <foreignObject
              key={i}
              x={x - 12 + (offset < 0 ? 0 : offset)}
              y={y - 12}
              width={35}
              height={35}
              className="pointer-events-none"
            >
              <Avatar src={avatarUrl} fallback={login[0]} size="1" radius="full" />
            </foreignObject>
          );
        })}
      </>
    );
  };

  const filename = useMemo(() => {
    const start = data[0]?.date || '';
    const end = data[data.length - 1]?.date || '';
    return `${labelMap[activityType].toLowerCase()}_activity_${start}_to_${end}`.replace(/\s+/g, '-');
  }, [data, activityType]);

  return (
    <Card className="h-[500px] w-full max-w-[650px] px-0">
      <Heading size="3" align="center">
        <ActivityTypeSelector onActivityTypeChange={setActivityType} mb="3" display="inline-flex" /> activity
      </Heading>
      <ResponsiveContainer minWidth={0} height="100%">
        <LineChart data={data} margin={{ top: 10, right: 40, bottom: 42, left: -10 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            minTickGap={8}
          />
          <YAxis axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={(v) => v.toFixed(0)} />
          <Tooltip
            content={
              <RechartTooltip
                renderEntries={(payload) => {
                  const sortedPayload = (payload as Entry[]).slice().sort((a, b) => b.value - a.value);
                  return sortedPayload.map((entry, index) => (
                    <Flex key={index} gap="1">
                      <Text size="1" style={{ color: entry.color }}>
                        {entry.name}:
                      </Text>
                      <Text size="1" weight="bold" style={{ color: entry.color }}>
                        {entry.value}
                      </Text>
                    </Flex>
                  ));
                }}
              />
            }
          />
          {contributorLogins.map((login, i) => (
            <Line
              key={login}
              type="monotone"
              dataKey={login}
              stroke={`hsl(${(i * 47) % 360}, 50%, 50%)`}
              strokeWidth={2}
              dot={false}
            />
          ))}
          <Customized component={AvatarRenderer} />
        </LineChart>
      </ResponsiveContainer>
      <CSVExportButton className="absolute right-4 top-2" data={data} filename={filename}>
        <ArrowDownToLine size={20} />
      </CSVExportButton>
    </Card>
  );
};

export default AnalyticsContributorLineChart;
