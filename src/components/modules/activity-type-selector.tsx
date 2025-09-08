'use client';

import { useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type ActivityType = 'commits' | 'pullRequests' | 'issues';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  onActivityTypeChange: (type: ActivityType) => void;
  defaultValue?: ActivityType;
};

const labels: Record<ActivityType, string> = {
  commits: 'Commits',
  pullRequests: 'Pull Requests',
  issues: 'Issues',
};

const ActivityTypeSelector = ({ onActivityTypeChange, defaultValue = 'commits', className, ...props }: Props) => {
  const [value, setValue] = useState<ActivityType>(defaultValue);

  const handleChange = (newValue: string) => {
    const type = newValue as ActivityType;
    setValue(type);
    onActivityTypeChange(type);
  };

  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`} {...props}>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select type" /></SelectTrigger>
        <SelectContent>
          {Object.entries(labels).map(([k, label]) => (
            <SelectItem key={k} value={k}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ActivityTypeSelector;
