'use client';

import { Flex, Box, Text, Separator } from '@radix-ui/themes';
import { CommitIcon, ChatBubbleIcon, MixerVerticalIcon } from '@radix-ui/react-icons';
import { TEnhancedUserWithStats } from '@/utils/schemas';
import { useMemo } from 'react';

type Props = {
  contributors: TEnhancedUserWithStats[];
};

const StatItem = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) => (
  <Flex align="center" justify="center" px="4" gap="3">
    <Box mb="1">{icon}</Box>
    <Text size="6" weight="bold">{value}</Text>
    <Text size="2" color="gray">{label}</Text>
  </Flex>
);

const AnalyticsTotalStats = ({ contributors }: Props) => {
  const { totalCommits, totalIssues, totalPRs } = useMemo(() => {
    return contributors.reduce(
      (acc, c) => ({
        totalCommits: acc.totalCommits + (c.commits?.length ?? 0),
        totalIssues: acc.totalIssues + (c.issues?.length ?? 0),
        totalPRs: acc.totalPRs + (c.pullRequests?.length ?? 0),
      }),
      { totalCommits: 0, totalIssues: 0, totalPRs: 0 },
    );
  }, [contributors]);

  return (
    <Flex align="center" justify="center">
      <StatItem icon={<CommitIcon />} value={totalCommits} label="Commits" />
      <Separator orientation="vertical" size="2" />
      <StatItem icon={<ChatBubbleIcon />} value={totalIssues} label="Issues" />
      <Separator orientation="vertical" size="2" />
      <StatItem icon={<MixerVerticalIcon />} value={totalPRs} label="PRs" />
    </Flex>
  );
};

export default AnalyticsTotalStats;
