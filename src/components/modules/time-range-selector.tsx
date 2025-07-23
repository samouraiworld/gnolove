'use client';

import { ComponentProps, useEffect, useState } from 'react';

import { Select, Flex, Text } from '@radix-ui/themes';
import { TimeFilter } from '@/utils/github';

type Props = ComponentProps<typeof Flex> & {
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
    <Flex direction="column" gap="1" {...props}>
      {showLabel && (
        <Text size="1" weight="medium">
          Date range
        </Text>
      )}
      <Select.Root value={value} onValueChange={handleChange}>
        <Select.Trigger variant="soft" />
        <Select.Content>
          {Object.entries(presets).map(([k, label]) => (
            <Select.Item key={k} value={k}>
              {label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
};

export default TimeRangeSelector;
