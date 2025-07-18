'use client';

import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Button, CheckboxGroup, Popover } from '@radix-ui/themes';

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
  defaultCheckedIds = [],
  ...props
}: Props & React.ComponentProps<typeof Button>) => {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button variant="soft" {...(props as React.ComponentProps<typeof Button>)}>
          <MixerHorizontalIcon />
          Repositories
        </Button>
      </Popover.Trigger>
      <Popover.Content>
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
