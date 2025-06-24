'use client';

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';

import { CheckIcon, Link1Icon, MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Badge, Button, CheckboxGroup, Flex, FlexProps, Popover, Spinner, Switch, Tabs, Text } from '@radix-ui/themes';

import ContributorTable from '@/module/contributor-table';

import useGetContributors from '@/hook/use-get-contributors';

import { TimeFilter } from '@/util/github';
import { TRepository } from '@/util/schemas';
import { getContributorsWithScore } from '@/util/score';

export interface ScoreboardProps {
  repositories: TRepository[];

  selectedRepositories: string[];
  setSelectedRepositories: Dispatch<SetStateAction<string[]>>;

  exclude: boolean;
  setExclude: Dispatch<SetStateAction<boolean>>;

  timeFilter: TimeFilter;
  setTimeFilter: Dispatch<SetStateAction<TimeFilter>>;
}

const TIMEFILTER_MAP = {
  [TimeFilter.ALL_TIME]: 'All time',
  [TimeFilter.YEARLY]: 'Yearly',
  [TimeFilter.MONTHLY]: 'Monthly',
  [TimeFilter.WEEKLY]: 'Weekly',
};

const fallbackMessages = [
  'Be the first to contribute during this period!',
  'This gnome team is still warming up... 🔧',
  'No activity yet — check back soon!',
  'No gnomes contributed during this time — maybe they’re on a break? 🧙‍♂️',
];

const Scoreboard = ({
  repositories,
  selectedRepositories,
  setSelectedRepositories,
  timeFilter,
  setTimeFilter,
  exclude,
  setExclude,
  ...props
}: ScoreboardProps & FlexProps) => {
  const [copied, setCopied] = useState(false);
  const [fallbackMessage, setFallbackMessages] = useState('');

  const { data: contributors, isPending } = useGetContributors({
    timeFilter,
    exclude,
    repositories: selectedRepositories,
  });

  const filteredContributors = useMemo(
    () => getContributorsWithScore(contributors ?? []).filter(({ score }) => score),
    [contributors],
  );

  useEffect(() => {
    setFallbackMessages(fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]);
  }, []);

  const handleCopyUrl = () => {
    const params = new URLSearchParams();
    params.set('f', timeFilter);
    if (exclude) params.set('e', '1');
    if (selectedRepositories.length) params.set('r', selectedRepositories.join(','));

    const url = `${window.location.origin}/?${params.toString()}`;
    navigator.clipboard.writeText(url);

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Flex direction="column" {...props}>
      <Tabs.Root value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)} mb="4">
        <Tabs.List justify="center">
          {Object.values(TimeFilter).map((value) => (
            <Tabs.Trigger value={value} key={value}>
              {TIMEFILTER_MAP[value]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      <Flex direction={{ initial: 'column', sm: 'row' }} gap="2" width="100%" justify={{ initial: 'start', sm: 'between' }} align={{ initial: 'start', sm: 'center' }}>
        <label htmlFor="excludeCoreTeam" className="my-2 flex items-center gap-1">
          <Switch checked={exclude} onCheckedChange={setExclude} id="excludeCoreTeam" />
          <span className="flex items-center gap-2">
            Hide the <Badge>Core team</Badge>
          </span>
        </label>

        <Button onClick={handleCopyUrl} variant="soft" mb="2">
          {copied ? <CheckIcon /> : <Link1Icon />}
          Share this board
        </Button>

        <Popover.Root>
          <Popover.Trigger>
            <Button variant="soft" mb="2">
              <MixerHorizontalIcon />
              Repositories
            </Button>
          </Popover.Trigger>

          <Popover.Content>
            <CheckboxGroup.Root value={selectedRepositories} onValueChange={setSelectedRepositories}>
              {repositories.map(({ id, name, owner }) => (
                <CheckboxGroup.Item disabled={id === 'gnolang/gno'} value={id} key={id}>
                  {owner}/{name}
                </CheckboxGroup.Item>
              ))}
            </CheckboxGroup.Root>
          </Popover.Content>
        </Popover.Root>
      </Flex>

      {isPending ? (
        <Flex my="9" justify="center" align="center">
          <Spinner />
        </Flex>
      ) : filteredContributors.length ? (
        <ContributorTable contributors={filteredContributors} sort showRank />
      ) : (
        <Flex my="9" justify="center" align="center">
          <Text className="italic" color="gray">
            {fallbackMessage}
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export default Scoreboard;
