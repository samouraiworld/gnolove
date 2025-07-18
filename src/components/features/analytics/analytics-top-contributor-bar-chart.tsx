'use client';

import React, { ReactElement, useMemo } from 'react';

import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Avatar, Card, Flex, Heading, IconButton, Text, Tooltip } from '@radix-ui/themes';
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

import RechartTooltip from '@/components/elements/rechart-tooltip';
import SCORE from '@/constants/score';
import { TEnhancedUserWithStats } from '@/utils/schemas';
import { getContributorsWithScore } from '@/utils/score';

type Contributor = {
  name: string;
  commits: { url: string }[];
  issues: { url: string }[];
  pullRequests: { url: string }[];
};

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

    console.log('Contributors:', contributors);

  const topContributors: TopContributorData[] = useMemo(() => {
    const contributorData = getContributorsWithScore(contributors)
      .filter(
        (contributor) =>
          contributor.commits?.length ||
          contributor.issues?.length ||
          contributor.pullRequests?.length ||
          contributor.score <= 0,
      )
      .map((contributor) => {
        const commits = (contributor?.commits ?? []).length;
        const issues = (contributor?.issues ?? []).length;
        const pullRequests = (contributor?.pullRequests ?? []).length;

        const weightedCommits = commits * SCORE.COMMIT_FACTOR;
        const weightedIssues = issues * SCORE.ISSUES_FACTOR;
        const weightedPullRequests = pullRequests * SCORE.PR_FACTOR;

        const totalActivity = weightedCommits + weightedIssues + weightedPullRequests;
        console.log('Total Activity:', totalActivity, 'for contributor:', contributor.login, weightedCommits, weightedIssues, weightedPullRequests);
        
        
        const commitsPercentage = contributor.score > 0 ? (weightedCommits * 100) / totalActivity : 0;
        const issuesPercentage = contributor.score > 0 ? (weightedIssues * 100) / totalActivity : 0;
        const pullRequestsPercentage = contributor.score > 0 ? (weightedPullRequests * 100) / totalActivity : 0;

        const commitsPercentageOfScore =
          contributor.score > 0 ? (weightedCommits / totalActivity) * contributor.score : 0;
        const issuesPercentageOfScore =
          contributor.score > 0 ? (weightedIssues / totalActivity) * contributor.score : 0;
        const pullRequestsPercentageOfScore =
          contributor.score > 0 ? (weightedPullRequests / totalActivity) * contributor.score : 0;

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
  }, [contributors, selectedRepositories]);

  console.log('topContributors:', topContributors);

  const renderEntries = (payload: any[], _label?: string | number) => {
    if (!payload || !payload[0]) return null;
    const p = payload[0].payload as TopContributorData;
    return (
      <Flex direction="column" gap="3">
        <Flex gap="1">
          <Text size="1">Commits: </Text>
          <Text size="1" weight="bold">
            {p.commitsPercentage.toFixed(0)}%
          </Text>
        </Flex>
        <Flex gap="1">
          <Text size="1">Issues: </Text>
          <Text size="1" weight="bold">
            {p.issuesPercentage.toFixed(0)}%
          </Text>
        </Flex>
        <Flex gap="1">
          <Text size="1">PRs: </Text>
          <Text size="1" weight="bold">
            {p.pullRequestsPercentage.toFixed(0)}%
          </Text>
        </Flex>
        <Flex gap="1">
          <Text size="1">Gnolove Power: </Text>
          <Text size="1" weight="bold">
            {p.score.toFixed(0)}
          </Text>
        </Flex>
      </Flex>
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
              <Avatar src={c.avatarUrl} fallback={c.login[0]} size="1" radius="full" />
            </foreignObject>
          );
        })}
      </>
    );
  };

  return (
    <Card className="h-[350px] w-full px-0">
      <Flex justify="center" align="center" gap="2">
        <Heading size="3" align="center">
          Top Contributors
        </Heading>
        <Tooltip content="The percentages are weighted by the Gnolove score calculation. This means that each contribution type (commits, issues, pull requests) is adjusted using predefined factors to reflect their relative importance in the overall score. This ensures a balanced representation of contributions based on their impact.">
          <IconButton variant='ghost' radius="full" size="1" asChild>
            <InfoCircledIcon className="cursor-pointer" />
          </IconButton>
        </Tooltip>
      </Flex>
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
    </Card>
  );
};

export default AnalyticsTopContributorBarChart;
