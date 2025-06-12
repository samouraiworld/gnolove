'use client';

import { useMemo } from 'react';

import { useTheme } from 'next-themes';

import { ChatBubbleIcon, CommitIcon, MixerVerticalIcon } from '@radix-ui/react-icons';
import { Box, Card, Flex, Heading, Text } from '@radix-ui/themes';
import dayjs from 'dayjs';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

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

const AnalyticsRecentActivity = ({ contributors, startDate }: Props) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const palette = isDark ? fillColors.dark : fillColors.light;

  const data: ActivityDataPoint[] = useMemo(() => {
    const map = new Map<string, { date: string; commits: number; prs: number; issues: number }>();

    const today = dayjs().startOf('day');
    for (let d = dayjs(startDate).startOf('day'); d.isBefore(today) || d.isSame(today); d = d.add(1, 'day')) {
      const date = d.format('YYYY-MM-DD');
      map.set(date, { date, commits: 0, prs: 0, issues: 0 });
    }

    for (const c of contributors) {
      c.commits?.forEach(({ createdAt }) => {
        const date = dayjs(createdAt).format('YYYY-MM-DD');
        if (dayjs(date).isBefore(startDate)) return;
        const entry = map.get(date);
        if (entry) entry.commits++;
      });

      c.pullRequests?.forEach(({ createdAt }) => {
        const date = dayjs(createdAt).format('YYYY-MM-DD');
        if (dayjs(date).isBefore(startDate)) return;
        const entry = map.get(date);
        if (entry) entry.prs++;
      });

      c.issues?.forEach(({ createdAt }) => {
        const date = dayjs(createdAt).format('YYYY-MM-DD');
        if (dayjs(date).isBefore(startDate)) return;
        const entry = map.get(date);
        if (entry) entry.issues++;
      });
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [contributors, startDate]);

  const TooltipRenderer: React.FC<TooltipProps<ValueType, NameType>> = ({ payload }) => {
    if (!payload || !payload[0]) return null;
    const p = payload[0].payload as ActivityDataPoint;
    return (
      <Card>
        <Box mb="2">
          <Text size="2" weight="bold">
            {p.date}
          </Text>
        </Box>
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
      </Card>
    );
  };

  return (
    <Card className="h-[450px] w-full min-w-[350px] max-w-[650px] px-0">
      <Heading size="3" align="center">
        Recent activity
      </Heading>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 60, bottom: 20, left: 0 }}>
          <XAxis axisLine={false} dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => Math.abs(value).toFixed(0).toString()} />
          <Tooltip offset={30} cursor={{ strokeDasharray: '3 3' }} content={<TooltipRenderer />} />
          <Bar maxBarSize={15} radius={[4, 4, 0, 0]} dataKey="commits" fill={palette.commits} />
          <Bar maxBarSize={15} radius={[4, 4, 0, 0]} dataKey="issues" fill={palette.issues} />
          <Bar maxBarSize={15} radius={[4, 4, 0, 0]} dataKey="prs" fill={palette.prs} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default AnalyticsRecentActivity;
