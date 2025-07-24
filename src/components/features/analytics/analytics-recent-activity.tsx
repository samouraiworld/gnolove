'use client';

import { useMemo } from 'react';

import { ChatBubbleIcon, CommitIcon, MixerVerticalIcon } from '@radix-ui/react-icons';
import { Card, Flex, Heading, Text } from '@radix-ui/themes';
import { ArrowDownToLine } from 'lucide-react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar } from 'recharts';

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
    <Flex direction="column" gap="3">
      <Flex gap="1">
        <CommitIcon />
        <Text size="1">Commits: </Text>
        <Text size="1" weight="bold">
          {p.commits}
        </Text>
      </Flex>
      <Flex gap="1">
        <ChatBubbleIcon />
        <Text size="1">Issues: </Text>
        <Text size="1" weight="bold">
          {p.issues}
        </Text>
      </Flex>
      <Flex gap="1">
        <MixerVerticalIcon />
        <Text size="1">PRs: </Text>
        <Text size="1" weight="bold">
          {p.prs}
        </Text>
      </Flex>
    </Flex>
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
    <Card className="h-[500px] w-full min-w-[350px] max-w-[650px] px-0">
      <Heading size="3" align="center">
        Recent activity
      </Heading>
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
          <RechartTooltip
            offset={30}
            cursor={{ strokeDasharray: '3 3' }}
            renderEntries={renderActivityEntries}
            renderLabel={(_label: string | number | undefined, payload?: any[]) => {
              const date = payload?.[0]?.payload?.date;
              return date ? (
                <Text size="2" weight="bold">
                  {date}
                </Text>
              ) : null;
            }}
          />
          <Bar maxBarSize={15} radius={[4, 4, 0, 0]} dataKey="commits" fill={fillColors.commits} />
          <Bar maxBarSize={15} radius={[4, 4, 0, 0]} dataKey="issues" fill={fillColors.issues} />
          <Bar maxBarSize={15} radius={[4, 4, 0, 0]} dataKey="prs" fill={fillColors.prs} />
        </BarChart>
      </ResponsiveContainer>
      <CSVExportButton className="absolute right-4 top-2" data={data} filename={filename}>
        <ArrowDownToLine size={20} />
      </CSVExportButton>
    </Card>
  );
};

export default AnalyticsRecentActivity;
