'use client';

import { ReactElement, useMemo } from 'react';

import { Avatar, Card, Heading } from '@radix-ui/themes';
import RechartTooltip from '@/components/elements/rechart-tooltip';
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
} from 'recharts';

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

  const { data, avatarData } = useMemo(() => {
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
  
    const cumulativeData: Record<string, number> = {};
    const cumulativeAvatar: Record<string, number> = {};
  
    const data: ContributorDataLinePoint[] = [];
    const avatarData: ContributorDataLinePoint[] = [];
  
    for (const date of datesSorted) {
      const rowData: ContributorDataLinePoint = { date };
      const rowAvatar: ContributorDataLinePoint = { date };
      const dailyContributors = countByDate[date] || {};
  
      // All login even for days without acitivities
      for (const login of contributorLogins) {
        const daily = dailyContributors[login] || 0;
        cumulativeData[login] = (cumulativeData[login] || 0) + daily;
        rowData[login] = cumulativeData[login];
      }
  
      // Only login with acitivities per day
      for (const login of Object.keys(dailyContributors)) {
        const daily = dailyContributors[login];
        cumulativeAvatar[login] = (cumulativeAvatar[login] || 0) + daily;
        rowAvatar[login] = cumulativeAvatar[login];
      }
  
      data.push(rowData);
      avatarData.push(rowAvatar);
    }
  
    return { data, avatarData };
  }, [contributorFiltered, type]);

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

  return (
    <Card className="h-[500px] w-full max-w-[650px] px-0">
      <Heading size="3" align="center">
        {labelMap[type]} activity
      </Heading>
      <ResponsiveContainer minWidth={0} height="100%">
        <LineChart data={data} margin={{ top: 20, right: 40, bottom: 20, left: -20 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={(v) => v.toFixed(0)} />
          <Tooltip content={<RechartTooltip />} />
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