'use client';

import { ComponentProps, useEffect, useState } from 'react';

import { Select, Flex, Text } from '@radix-ui/themes';
import { subDays, subMonths } from 'date-fns';

type Preset = '7d' | '14d' | '1m';

type Props = ComponentProps<typeof Flex> & {
  onDateChange: (startDate: Date) => void; // Renamed to avoid conflict
  defaultValue?: Preset;
};

const presets: Record<Preset, string> = {
  '7d': 'Past 7 days',
  '14d': 'Past 14 days',
  '1m': 'Past month',
};

const getStartDate = (key: Preset): Date => {
  switch (key) {
    case '7d':
      return subDays(new Date(), 7);
    case '14d':
      return subDays(new Date(), 14);
    case '1m':
      return subMonths(new Date(), 1);
    default:
      return new Date();
  }
};

const TimeRangeSelector = ({ onDateChange, defaultValue = '14d', ...props }: Props) => {
  const [value, setValue] = useState<Preset>(defaultValue);

  useEffect(() => {
    onDateChange(getStartDate(defaultValue));
  }, [defaultValue, onDateChange]);

  const handleChange = (newValue: string) => {
    const key = newValue as Preset;
    setValue(key);
    onDateChange(getStartDate(key));
  };

  return (
    <Flex direction="column" gap="1" {...props}>
      <Text size="1" weight="medium">
        Date range
      </Text>
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
