'use client';

import React, { ReactElement, useMemo } from 'react';

import { Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as NativeRechartTooltip,
  ResponsiveContainer,
  Legend,
  CustomizedProps,
  Customized,
} from 'recharts';

import { TEnhancedUserWithStats } from '@/utils/schemas';

import RechartTooltip from '@/components/elements/rechart-tooltip';

import useGetScoreFactors from '@/hooks/use-get-score-factors';

type Props = {
  contributors: TEnhancedUserWithStats[];
  selectedRepositories: string[];
};

type TopContributorData = {
  login: string;
  commitsPercentage: number;
  issuesPercentage: number;
  pullRequestsPercentage: number;
  commitsPercentageOfScore: number;
  issuesPercentageOfScore: number;
  pullRequestsPercentageOfScore: number;
  score: number;
  avatarUrl: string;
};

const AnalyticsTopContributorBarChart = ({ contributors, selectedRepositories }: Props) => {
  const { data: scoreFactors } = useGetScoreFactors();

  const topContributors: TopContributorData[] = useMemo(() => {
    const contributorData = contributors
      .filter((contributor) => contributor.TotalCommits || contributor.TotalIssues || contributor.TotalPrs)
      .map((contributor) => {
        const weightedCommits = contributor.TotalCommits * (scoreFactors?.commitFactor ?? 0);
        const weightedIssues = contributor.TotalIssues * (scoreFactors?.issueFactor ?? 0);
        const weightedPullRequests = contributor.TotalPrs * (scoreFactors?.prFactor ?? 0);

        const totalActivity = weightedCommits + weightedIssues + weightedPullRequests;

        const commitsPercentage =
          contributor.score > 0 && totalActivity > 0 ? (weightedCommits * 100) / totalActivity : 0;
        const issuesPercentage =
          contributor.score > 0 && totalActivity > 0 ? (weightedIssues * 100) / totalActivity : 0;
        const pullRequestsPercentage =
          contributor.score > 0 && totalActivity > 0 ? (weightedPullRequests * 100) / totalActivity : 0;

        const commitsPercentageOfScore =
          contributor.score > 0 && totalActivity > 0 ? (weightedCommits / totalActivity) * contributor.score : 0;
        const issuesPercentageOfScore =
          contributor.score > 0 && totalActivity > 0 ? (weightedIssues / totalActivity) * contributor.score : 0;
        const pullRequestsPercentageOfScore =
          contributor.score > 0 && totalActivity > 0 ? (weightedPullRequests / totalActivity) * contributor.score : 0;

        return {
          login: contributor.login,
          commitsPercentage: commitsPercentage,
          issuesPercentage: issuesPercentage,
          pullRequestsPercentage: pullRequestsPercentage,
          commitsPercentageOfScore: commitsPercentageOfScore,
          issuesPercentageOfScore: issuesPercentageOfScore,
          pullRequestsPercentageOfScore: pullRequestsPercentageOfScore,
          score: contributor.score,
          avatarUrl: contributor.avatarUrl,
        };
      });

    return contributorData
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .reverse();
  }, [contributors, selectedRepositories, scoreFactors]);

  const renderEntries = (payload: any[], _label?: string | number) => {
    if (!payload || !payload[0]) return null;
    const p = payload[0].payload as TopContributorData;
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xs">Commits: </span>
          <span className="text-xs font-bold">{p.commitsPercentage.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs">Issues: </span>
          <span className="text-xs font-bold">{p.issuesPercentage.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs">PRs: </span>
          <span className="text-xs font-bold">{p.pullRequestsPercentage.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs">Gnolove Power: </span>
          <span className="text-xs font-bold">{p.score.toFixed(0)}</span>
        </div>
      </div>
    );
  };

  const AvatarRenderer: React.FC<CustomizedProps<any, ReactElement>> = ({ xAxisMap = {}, yAxisMap = {} }) => {
    const xAxis: any = Object.values(xAxisMap)[0];
    const yAxis: any = Object.values(yAxisMap)[0];
    if (!xAxis || !yAxis) return null;

    const scaleX = typeof xAxis?.scale === 'function' ? xAxis.scale : () => 0;
    const scaleY = typeof yAxis?.scale === 'function' ? yAxis.scale : () => 0;
    const bandSize = xAxis?.bandSize || 0;

    return (
      <>
        {topContributors.map((c, i) => {
          const x = scaleX(c.login) + bandSize / 2 - 13; // Center the avatar on the bar
          const y = scaleY(c.score);

          return (
            <foreignObject key={i} x={x} y={y - 34} width={35} height={35} className="pointer-events-none">
              <div className="h-[24px] w-[24px] overflow-hidden rounded-full">
                <Avatar>
                  <AvatarImage src={c.avatarUrl} alt={c.login} />
                  <AvatarFallback>{c.login[0]}</AvatarFallback>
                </Avatar>
              </div>
            </foreignObject>
          );
        })}
      </>
    );
  };

  return (
    <div className="h-[350px] w-full px-0 border rounded-md">
      <div className="flex items-center justify-center gap-2">
        <h2 className="text-lg font-semibold text-center">Top Contributors</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Info className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">
            The percentages are weighted by the Gnolove score calculation. This means that each contribution type (commits, issues, pull requests) is adjusted using predefined factors to reflect their relative importance in the overall score. This ensures a balanced representation of contributions based on their impact.
          </TooltipContent>
        </Tooltip>
      </div>
      <ResponsiveContainer minWidth={0} height="100%">
        <BarChart data={topContributors} layout="horizontal" margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <XAxis type="category" dataKey="login" hide />
          <YAxis type="number" padding={{ top: 20, bottom: 20 }} />
          <NativeRechartTooltip
            offset={30}
            cursor={{ strokeDasharray: '3 3' }}
            content={<RechartTooltip renderEntries={renderEntries} />}
          />
          <Legend />
          <Bar dataKey="commitsPercentageOfScore" stackId="a" fill="#8884d8" name="Commits %" />
          <Bar dataKey="issuesPercentageOfScore" stackId="a" fill="#82ca9d" name="Issues %" />
          <Bar dataKey="pullRequestsPercentageOfScore" stackId="a" fill="#ffc658" name="Pull Requests %" />
          <Bar dataKey="score" stackId="b" fill="#ff5858" name="Gnolove power" />
          <Customized component={AvatarRenderer} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsTopContributorBarChart;
