'use client';

import { Button, Popover, CheckboxGroup, Checkbox, Separator, Text, Flex } from '@radix-ui/themes';
import { PersonIcon } from '@radix-ui/react-icons';

const TeamSelector = ({
  teams,
  selectedTeams,
  onSelectedTeamsChange,
  ...props
}: {
  teams: { name: string }[];
  selectedTeams: string[];
  onSelectedTeamsChange: (selected: string[]) => void;
} & React.ComponentProps<typeof Button>) => {
  const handleSelectAllToggle = () => {
    if (selectedTeams.length === teams.length) {
      onSelectedTeamsChange([]);
    } else {
      onSelectedTeamsChange(teams.map((team) => team.name));
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button variant="soft" {...(props as React.ComponentProps<typeof Button>)}>
          <PersonIcon /> Teams
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <Text as="label" size="2">
          <Flex as="span" gap="2">
            <Checkbox checked={selectedTeams.length === teams.length} onCheckedChange={handleSelectAllToggle} />{' '}
            Select/Unselect All
          </Flex>
        </Text>
        <Separator size="4" my="2" />
        <CheckboxGroup.Root
          value={selectedTeams}
          onValueChange={onSelectedTeamsChange}
        >
          {teams.map(({ name }) => (
            <CheckboxGroup.Item key={name} value={name}>
              {name}
            </CheckboxGroup.Item>
          ))}
        </CheckboxGroup.Root>
      </Popover.Content>
    </Popover.Root>
  );
};

export default TeamSelector;