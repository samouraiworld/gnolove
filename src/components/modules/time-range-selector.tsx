'use client';

import { useEffect, useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeFilter } from '@/utils/github';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  onDateChange: (timeFilter: TimeFilter) => void;
  defaultValue?: TimeFilter;
  showLabel?: boolean;
};

const presets: Record<TimeFilter, string> = {
  [TimeFilter.ALL_TIME]: 'All time',
  [TimeFilter.YEARLY]: 'Past year',
  [TimeFilter.MONTHLY]: 'Past month',
  [TimeFilter.WEEKLY]: 'Past week',
};

const TimeRangeSelector = ({ onDateChange, defaultValue = TimeFilter.WEEKLY, showLabel = true, ...props }: Props) => {
  const [value, setValue] = useState<TimeFilter>(defaultValue);

  useEffect(() => {
    onDateChange(defaultValue);
  }, [defaultValue, onDateChange]);

  const handleChange = (newValue: string) => {
    const key = newValue as TimeFilter;
    setValue(key);
    onDateChange(key);
  };

  return (
    <div className="flex flex-col gap-1" {...props}>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground">Date range</span>
      )}
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select range" /></SelectTrigger>
        <SelectContent>
          {Object.entries(presets).map(([k, label]) => (
            <SelectItem key={k} value={k}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimeRangeSelector;
