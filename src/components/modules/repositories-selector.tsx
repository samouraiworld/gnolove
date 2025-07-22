'use client';

import { useEffect } from 'react';

import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Button, Checkbox, CheckboxGroup, Flex, Popover, Separator, Text } from '@radix-ui/themes';

type Repository = {
  id: string;
  name: string;
  owner: string;
};

type Props = {
  repositories: Repository[];
  selectedRepositories: string[];
  onSelectedRepositoriesChange: (selected: string[]) => void;
  defaultCheckedIds?: string[];
};

const RepositoriesSelector = ({
  repositories,
  selectedRepositories,
  onSelectedRepositoriesChange,
  defaultCheckedIds = ['gnolang/gno'],
  ...props
}: Props & React.ComponentProps<typeof Button>) => {
  const handleSelectAllToggle = () => {
    if (selectedRepositories.length === repositories.length) {
      onSelectedRepositoriesChange(defaultCheckedIds);
    } else {
      onSelectedRepositoriesChange(repositories.map((repo) => repo.id));
    }
  };

  useEffect(() => {
    if (selectedRepositories.length === 0) {
      onSelectedRepositoriesChange(defaultCheckedIds);
    }
  }, [selectedRepositories.length, defaultCheckedIds]);

  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button variant="soft" {...(props as React.ComponentProps<typeof Button>)}>
          <MixerHorizontalIcon />
          Repositories
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <Text as="label" size="2">
          <Flex as="span" gap="2">
            <Checkbox
              checked={selectedRepositories.length === repositories.length}
              onCheckedChange={handleSelectAllToggle}
            />{' '}
            Select/Unselect All
          </Flex>
        </Text>

        <Separator size="4" my="2" />

        <CheckboxGroup.Root
          value={selectedRepositories}
          onValueChange={onSelectedRepositoriesChange}
          defaultValue={defaultCheckedIds}
        >
          {repositories.map(({ id, name, owner }) => (
            <CheckboxGroup.Item key={id} value={id}>
              {owner}/{name}
            </CheckboxGroup.Item>
          ))}
        </CheckboxGroup.Root>
      </Popover.Content>
    </Popover.Root>
  );
};

export default RepositoriesSelector;
