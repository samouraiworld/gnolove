'use client';

import { useState } from 'react';

import { Select, Flex, Text } from '@radix-ui/themes';
import dayjs from 'dayjs';

type Preset = '7d' | '14d' | '1m';

type Props = {
  onChange: (startDate: Date) => void;
  defaultValue?: Preset;
};

const presets: Record<Preset, string> = {
  '7d': '7 derniers jours',
  '14d': '14 jours',
  '1m': '1 mois',
};

const getStartDate = (key: Preset): Date => {
  if (key.endsWith('d'))
    return dayjs()
      .subtract(Number(key.replace('d', '')), 'day')
      .toDate();
  return dayjs()
    .subtract(Number(key.replace('m', '').replace('y', '')), key.includes('y') ? 'year' : 'month')
    .toDate();
};

const TimeRangeSelector = ({ onChange, defaultValue = '14d' }: Props) => {
  const [value, setValue] = useState<Preset>(defaultValue);

  const handleChange = (newValue: string) => {
    const key = newValue as Preset;
    setValue(key);
    onChange(getStartDate(key));
  };

  return (
    <Flex direction="column" gap="1" mb="3">
      <Text size="1" weight="medium">
        Période d'activité
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
