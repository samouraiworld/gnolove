'use client';

import { useMemo } from 'react';

import { useTheme } from 'next-themes';

import { ChatBubbleIcon, CommitIcon, MixerVerticalIcon } from '@radix-ui/react-icons';
import { Card, Flex, Heading, Text } from '@radix-ui/themes';
import RechartTooltip from '@/components/elements/rechart-tooltip';
import { format, isBefore, isEqual, parseISO, addDays, startOfDay, startOfToday } from 'date-fns';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';


import { TEnhancedUserWithStats } from '@/utils/schemas';

const fillColors = {
  light: {
    commits: '#9ca3af',
    issues: '#6b7280',
    prs: '#4b5563',
  },
  dark: {
    commits: '#d1d5db',
    issues: '#9ca3af',
    prs: '#6b7280',
  },
};

type ActivityDataPoint = {
  date: string;
  commits: number;
  issues: number;
  prs: number;
};

type Props = {
  contributors: TEnhancedUserWithStats[];
  startDate: Date;
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

const AnalyticsRecentActivity = ({ contributors, startDate }: Props) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const palette = isDark ? fillColors.dark : fillColors.light;

  const data: ActivityDataPoint[] = useMemo(() => {
    const map = new Map<string, ActivityDataPoint>();
    const today = startOfToday();
    for (let d = startOfDay(startDate); isBefore(d, today) || isEqual(d, today); d = addDays(d, 1)) {
      const key = format(d, 'yyyy-MM-dd');
      map.set(key, { date: key, commits: 0, prs: 0, issues: 0 });
    }

    for (const c of contributors) {
      c.commits?.forEach(({ createdAt }) => {
        const date = format(parseISO(createdAt), 'yyyy-MM-dd');
        if (isBefore(parseISO(createdAt), startDate)) return;
        map.get(date)!.commits++;
      });

      c.pullRequests?.forEach(({ createdAt }) => {
        const date = format(parseISO(createdAt), 'yyyy-MM-dd');
        if (isBefore(parseISO(createdAt), startDate)) return;
        map.get(date)!.prs++;
      });

      c.issues?.forEach(({ createdAt }) => {
        const date = format(parseISO(createdAt), 'yyyy-MM-dd');
        if (isBefore(parseISO(createdAt), startDate)) return;
        map.get(date)!.issues++;
      });
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [contributors, startDate]);

  return (
    <Card className="h-[500px] w-full min-w-[350px] max-w-[650px] px-0">
      <Heading size="3" align="center">
        Recent activity
      </Heading>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 40, bottom: 20, left: -20 }}>
          <XAxis axisLine={false} dataKey="date" tick={{ fontSize: 10 }} tickLine={false} tickMargin={10} minTickGap={8}/>
          <YAxis axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={(value) => Math.abs(value).toFixed(0).toString()} />
          <Tooltip
            offset={30}
            cursor={{ strokeDasharray: '3 3' }}
            content={
              <RechartTooltip
                renderEntries={renderActivityEntries}
                renderLabel={(
                  _label: string | number | undefined,
                  payload?: any[]
                ) => {
                  // Use the date from the first payload entry
                  const date = payload?.[0]?.payload?.date;
                  return date ? <Text size="2" weight="bold">{date}</Text> : null;
                }}
              />
            }
          />
          <Bar maxBarSize={15} radius={[4, 4, 0, 0]} dataKey="commits" fill={palette.commits} />
          <Bar maxBarSize={15} radius={[4, 4, 0, 0]} dataKey="issues" fill={palette.issues} />
          <Bar maxBarSize={15} radius={[4, 4, 0, 0]} dataKey="prs" fill={palette.prs} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default AnalyticsRecentActivity;
