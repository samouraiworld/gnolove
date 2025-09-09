import React from 'react';

import { ExternalLink } from 'lucide-react';

import { TMilestone } from '@/utils/schemas';

import { Progress } from '@/components/ui/progress';

export interface MilestoneProgressProps {
  milestone: TMilestone;
}

const MilestoneProgress = ({
  milestone,
  className,
  ...props
}: MilestoneProgressProps & React.HTMLAttributes<HTMLDivElement>) => {
  const closedIssues = milestone.issues.filter(({ state }) => state === 'CLOSED');
  const openIssues = milestone.issues.filter(({ state }) => state === 'OPEN');

  const progress = (closedIssues.length / (openIssues.length + closedIssues.length)) * 100;

  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`} {...props}>
      <div className="flex items-center justify-center gap-2">
        <span className="font-bold">
          {milestone.title} ({progress.toFixed(2)}%)
        </span>
        <ExternalLink className="text-primary h-4 w-4" />
      </div>
      <Progress className="w-full" value={progress} />
    </div>
  );
};

export default MilestoneProgress;
