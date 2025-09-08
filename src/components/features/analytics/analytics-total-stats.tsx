'use client';

import { useEffect, useMemo, useState } from 'react';

import { GitCommit, MessageSquare, GitPullRequest } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { motion, animate } from 'motion/react';

import { TEnhancedUserWithStats } from '@/utils/schemas';

type Props = {
  contributors: TEnhancedUserWithStats[];
};

const StatItem = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const animation = animate(0, value, {
      duration: 1,
      onUpdate: (latest: any) => setAnimatedValue(Math.floor(latest as number)),
    });

    return () => animation.stop();
  }, [value]);

  return (
    <div className="flex items-center justify-center gap-3 px-4">
      <div className="mb-1">{icon}</div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <span className="text-2xl font-bold">{animatedValue}</span>
      </motion.div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
};

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
    <div className="flex items-center justify-center">
      <StatItem icon={<GitCommit className="h-5 w-5" />} value={totalCommits} label="Commits" />
      <Separator orientation="vertical" className="mx-2 h-6" />
      <StatItem icon={<MessageSquare className="h-5 w-5" />} value={totalIssues} label="Issues" />
      <Separator orientation="vertical" className="mx-2 h-6" />
      <StatItem icon={<GitPullRequest className="h-5 w-5" />} value={totalPRs} label="PRs" />
    </div>
  );
};

export default AnalyticsTotalStats;
