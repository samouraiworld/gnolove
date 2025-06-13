'use client';

import { useEffect, useState } from 'react';

import { Select, Flex, Text } from '@radix-ui/themes';
import { subDays, subMonths } from 'date-fns';

type Preset = '7d' | '14d' | '1m';

type Props = {
  onChange: (startDate: Date) => void;
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

const TimeRangeSelector = ({ onChange, defaultValue = '14d' }: Props) => {
  const [value, setValue] = useState<Preset>(defaultValue);

  useEffect(() => {
    onChange(getStartDate(defaultValue));
  }, [defaultValue, onChange]);

  const handleChange = (newValue: string) => {
    const key = newValue as Preset;
    setValue(key);
    onChange(getStartDate(key));
  };

  return (
    <Flex direction="column" gap="1" mb="3">
      <Text size="1" weight="medium">
        Date range
      </Text>
      <Select.Root value={value} onValueChange={handleChange}>
        <Select.Trigger />
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
