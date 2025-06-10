'use client';

import { useState } from 'react';

import { Select, Flex, Text } from '@radix-ui/themes';

export type ActivityType = 'commits' | 'pullRequests' | 'issues';

type Props = {
  onChange: (type: ActivityType) => void;
  defaultValue?: ActivityType;
};

const labels: Record<ActivityType, string> = {
  commits: 'Commits',
  pullRequests: 'Pull Requests',
  issues: 'Issues',
};

const ActivityTypeSelector = ({ onChange, defaultValue = 'commits' }: Props) => {
  const [value, setValue] = useState<ActivityType>(defaultValue);

  const handleChange = (newValue: string) => {
    const type = newValue as ActivityType;
    setValue(type);
    onChange(type);
  };

  return (
    <Flex direction="column" gap="1" mb="3">
      <Text size="1" weight="medium">
        Type d'activité
      </Text>
      <Select.Root value={value} onValueChange={handleChange}>
        <Select.Trigger />
        <Select.Content>
          {Object.entries(labels).map(([k, label]) => (
            <Select.Item key={k} value={k}>
              {label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
};

export default ActivityTypeSelector;
