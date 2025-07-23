'use client';

import { ComponentProps, useState } from 'react';

import { Select, Flex } from '@radix-ui/themes';

export type ActivityType = 'commits' | 'pullRequests' | 'issues';

type Props = ComponentProps<typeof Flex> & {
  onActivityTypeChange: (type: ActivityType) => void;
  defaultValue?: ActivityType;
};

const labels: Record<ActivityType, string> = {
  commits: 'Commits',
  pullRequests: 'Pull Requests',
  issues: 'Issues',
};

const ActivityTypeSelector = ({ onActivityTypeChange, defaultValue = 'commits', ...props }: Props) => {
  const [value, setValue] = useState<ActivityType>(defaultValue);

  const handleChange = (newValue: string) => {
    const type = newValue as ActivityType;
    setValue(type);
    onActivityTypeChange(type);
  };

  return (
    <Flex {...props} direction="column" gap="1">
      <Select.Root value={value} onValueChange={handleChange}>
        <Select.Trigger variant="soft" />
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
