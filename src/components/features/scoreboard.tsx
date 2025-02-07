'use client';

import { Dispatch, SetStateAction } from 'react';

import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Badge, Button, CheckboxGroup, Flex, FlexProps, Popover, Switch, Tabs, Text } from '@radix-ui/themes';

import ContributorTable from '@/module/contributor-table';

import { isTimeFilter, TimeFilter } from '@/util/github';
import { TEnhancedUserWithStatsAndScore, TRepository } from '@/util/schemas';

export interface ScoreboardProps {
  repositories: TRepository[];

  selectedRepositories: string[];
  setSelectedRepositories: Dispatch<SetStateAction<string[]>>;

  exclude: boolean;
  setExclude: Dispatch<SetStateAction<boolean>>;

  timeFilter: TimeFilter;
  setTimeFilter: Dispatch<SetStateAction<TimeFilter>>;

  contributors: TEnhancedUserWithStatsAndScore[];
}

const Scoreboard = ({
  repositories,
  selectedRepositories,
  setSelectedRepositories,
  contributors,
  timeFilter,
  setTimeFilter,
  exclude,
  setExclude,
  ...props
}: ScoreboardProps & FlexProps) => {
  return (
    <Flex direction="column" {...props}>
      <Tabs.Root value={timeFilter.toString()} onValueChange={(value) => setTimeFilter(value as TimeFilter)} mb="4">
        <Tabs.List justify="center">
          {Object.keys(TimeFilter)
            .filter(isTimeFilter)
            .map((key) => (
              <Tabs.Trigger value={TimeFilter[key]} key={key}>
                {TimeFilter[key]}
              </Tabs.Trigger>
            ))}
        </Tabs.List>
      </Tabs.Root>

      <Flex width="100%" justify="between" align="center">
        <label htmlFor="excludeCoreTeam" className="my-2 flex items-center gap-1">
          <Switch defaultChecked={exclude} onCheckedChange={setExclude} id="excludeCoreTeam" />
          <span className="flex items-center gap-2">
            Hide the
            <Badge>Core team</Badge>
          </span>
        </label>

        <Popover.Root>
          <Popover.Trigger>
            <Button variant="soft">
              <MixerHorizontalIcon />
              Repositories
            </Button>
          </Popover.Trigger>

          <Popover.Content>
            <CheckboxGroup.Root
              defaultValue={['gnolang/gno', ...selectedRepositories]}
              onValueChange={setSelectedRepositories}
            >
              {repositories.map(({ id, name, owner }) => (
                <CheckboxGroup.Item disabled={id === 'gnolang/gno'} value={id} key={id}>
                  {owner}/{name}
                </CheckboxGroup.Item>
              ))}
            </CheckboxGroup.Root>
          </Popover.Content>
        </Popover.Root>
      </Flex>

      {contributors.length ? (
        <ContributorTable contributors={contributors} sort showRank />
      ) : (
        <Flex my="9" justify="center" align="center">
          <Text className="italic" color="gray">
            Could not find any contributors... 😢
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export default Scoreboard;
