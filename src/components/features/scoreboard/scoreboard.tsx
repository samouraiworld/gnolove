'use client';

import { useEffect, useMemo, useState } from 'react';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

import { CheckIcon, Link1Icon } from '@radix-ui/react-icons';
import { Badge, Button, Flex, FlexProps, Spinner, Switch, Tabs, Text } from '@radix-ui/themes';

import ContributorTable from '@/modules/contributor-table';

import useGetContributors from '@/hooks/use-get-contributors';

import { getTimeFilterFromSearchParam, TimeFilter } from '@/utils/github';
import { getContributorsWithScore } from '@/utils/score';
import useGetRepositories from '@/hooks/use-get-repositories';
import RepositoriesSelector from '@/components/modules/repositories-selector';

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

const Scoreboard = ({ ...props }: FlexProps) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState('');

  const searchParams = useSearchParams();

  const initialTimeFilter = getTimeFilterFromSearchParam(searchParams.get('f'), TimeFilter.MONTHLY);
  const initialExclude = !!searchParams.get('e');
  const initialRepoIds = searchParams.get('r')?.split(',') ?? [];

  const [timeFilter, setTimeFilter] = useState<TimeFilter>(initialTimeFilter);
  const [exclude, setExclude] = useState<boolean>(initialExclude);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(initialRepoIds);

  const { data: repositories = [] } = useGetRepositories();
  const { data: contributors, isPending } = useGetContributors({
    timeFilter,
    exclude,
    repositories: selectedRepositories,
  });

  const filteredContributors = useMemo(
    () => getContributorsWithScore(contributors ?? []).filter(({ score }) => score),
    [contributors],
  );

  const buildSearchParams = () => {
    const params = new URLSearchParams();
    params.set('f', timeFilter);
    if (exclude) params.set('e', '1');
    if (selectedRepositories.length) params.set('r', selectedRepositories.join(','));
    return params;
  };

  useEffect(() => {
    const urlParams = buildSearchParams().toString();
    const currentParams = searchParams.toString();
    if (urlParams === currentParams) return;

    router.replace(`?${urlParams}`);
  }, [timeFilter, exclude, selectedRepositories, router, searchParams, buildSearchParams]);

  useEffect(() => {
    setFallbackMessage(fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]);
  }, []);

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/?${buildSearchParams().toString()}`;
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

      <Flex
        direction={{ initial: 'column', sm: 'row' }}
        gap="2"
        width="100%"
        justify={{ initial: 'start', sm: 'between' }}
        align={{ initial: 'start', sm: 'center' }}
      >
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

        <RepositoriesSelector
          repositories={repositories}
          selectedRepositories={selectedRepositories}
          onSelectedRepositoriesChange={setSelectedRepositories}
          defaultCheckedIds={['gnolang/gno']}
        />
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
