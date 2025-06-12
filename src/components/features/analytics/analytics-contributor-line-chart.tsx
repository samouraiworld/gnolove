'use client';

import { ReactElement, useMemo } from 'react';

import { Avatar, Box, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { format, parseISO, compareAsc } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Customized,
  CustomizedProps,
  TooltipProps,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { TEnhancedUserWithStats } from '@/utils/schemas';

const labelMap: Record<Props['type'], string> = {
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
  type: 'commits' | 'pullRequests' | 'issues';
};

const AnalyticsContributorLineChart = ({ contributors, type = 'commits' }: Props) => {
  const contributorFiltered = useMemo(
    () => contributors.filter((c) => (c[type]?.length || 0) > 0),
    [contributors, type],
  );

  const data: ContributorDataLinePoint[] = useMemo(() => {
    const countByDate: Record<string, Record<string, number>> = {};

    for (const c of contributorFiltered) {
      const list = c[type] || [];
      for (const item of list) {
        const rawDate = item.createdAt;
        const parsed = parseISO(rawDate);
        const date = format(parsed, 'yyyy-MM-dd');
        if (!countByDate[date]) countByDate[date] = {};
        countByDate[date][c.login] = (countByDate[date][c.login] || 0) + 1;
      }
    }

    const datesSorted = Object.keys(countByDate).sort((a, b) => compareAsc(parseISO(a), parseISO(b)));
    const contributorLogins = contributorFiltered.map((c) => c.login);
    const cumulative: Record<string, number> = {};

    return datesSorted.map((date) => {
      const row: ContributorDataLinePoint = { date };

      contributorLogins.forEach((login) => {
        const daily = countByDate[date]?.[login] || 0;
        cumulative[login] = (cumulative[login] || 0) + daily;
        row[login] = cumulative[login];
      });

      return row;
    });
  }, [contributorFiltered, type]);

  const contributorLogins = useMemo(() => contributorFiltered.map((c) => c.login), [contributorFiltered]);

  const AvatarRenderer: React.FC<CustomizedProps<any, ReactElement>> = ({ xAxisMap = {}, yAxisMap = {} }) => {
    const xAxis: any = Object.values(xAxisMap)[0];
    const yAxis: any = Object.values(yAxisMap)[0];
    if (!xAxis || !yAxis) return null;

    const scaleX = typeof xAxis?.scale === 'function' ? xAxis.scale : () => 0;
    const scaleY = typeof yAxis?.scale === 'function' ? yAxis.scale : () => 0;

    const positionMap = new Map<number, number>();

    return (
      <>
        {contributorFiltered.map((c, i) => {
          const login = c.login;
          const avatarUrl = c.avatarUrl;
          const lastEntry = [...data].reverse().find((d: any) => d[login] !== undefined);
          if (!lastEntry) return null;

          const x = scaleX(lastEntry.date);
          const y = scaleY(lastEntry[login]);

          const xKey = Math.round(x);
          const offset = (positionMap.get(xKey) || 0) * 28;
          positionMap.set(xKey, (positionMap.get(xKey) || 0) + 1);

          return (
            <foreignObject
              key={i}
              x={x - 12 - offset}
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

  const TooltipRenderer: React.FC<TooltipProps<ValueType, NameType>> = ({ payload, label }) => {
    if (!payload?.length) return null;

    return (
      <Card>
        <Box mb="2">
          <Text size="2" weight="bold">
            {label}
          </Text>
        </Box>
        <Flex direction="column" gap="2">
          {payload.map((entry: any, i: number) => (
            <Flex key={i} gap="2">
              <Text size="1" style={{ color: entry.color }}>
                {entry.name}:
              </Text>
              <Text size="1" weight="bold" style={{ color: entry.color }}>
                {entry.value}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Card>
    );
  };

  return (
    <Card className="h-[450px] w-full min-w-[350px] max-w-[650px] px-0">
      <Heading size="3" align="center">
        {labelMap[type]} activity
      </Heading>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 60, bottom: 20, left: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(0)} />
          <Tooltip content={<TooltipRenderer />} />
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
    </Card>
  );
};

export default AnalyticsContributorLineChart;