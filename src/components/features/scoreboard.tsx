'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Badge, Button, CheckboxGroup, Flex, FlexProps, Popover, Switch, TabNav, Text } from '@radix-ui/themes';

import ContributorTable from '@/module/contributor-table';

import { isTimeFilter, TimeFilter } from '@/util/github';
import { TEnhancedUserWithStatsAndScore, TRepository } from '@/util/schemas';

export interface ScoreboardProps {
  repositories: TRepository[];
  selectedRepositories: TRepository[];
  contributors: TEnhancedUserWithStatsAndScore[];
  timeFilter: TimeFilter;
  excludeCoreTeam: boolean;
}

const Scoreboard = ({
  repositories,
  selectedRepositories,
  contributors,
  timeFilter,
  excludeCoreTeam,
  ...props
}: ScoreboardProps & FlexProps) => {
  const router = useRouter();

  const selectedRepositoriesId = selectedRepositories.map(({ id }) => id);

  const getSearchParams = ({ f, e, r }: { f?: string; e?: boolean; r?: string[] }) => {
    const filter = f || timeFilter;
    const repositories = r || selectedRepositoriesId;
    const exclude = e || excludeCoreTeam;

    const searchParams = new URLSearchParams();
    searchParams.set('f', filter);
    for (const repo of repositories) searchParams.append('r', repo);
    if (exclude) searchParams.set('e', '1');
    return searchParams;
  };

  const onCheckedChange = (value: boolean) => {
    const search = getSearchParams({ e: value });
    router.push(`?${search.toString()}`);
  };

  const onValueChange = (value: string[]) => {
    const filteredRepositories = repositories.map(({ id }) => id).filter((id) => value.includes(id));
    const search = getSearchParams({ r: filteredRepositories });
    router.push(`?${search.toString()}`);
  };

  return (
    <Flex direction="column" {...props}>
      <TabNav.Root justify="center" mb="4">
        {Object.keys(TimeFilter)
          .filter(isTimeFilter)
          .map((key) => {
            const href = `?${getSearchParams({ f: key })}`;
            const active = timeFilter.toString() === TimeFilter[key];

            return (
              <TabNav.Link key={key} {...{ href, active }} asChild>
                <Link href={href}>{TimeFilter[key]}</Link>
              </TabNav.Link>
            );
          })}
      </TabNav.Root>

      <Flex width="100%" justify="between" align="center">
        <label htmlFor="excludeCoreTeam" className="my-2 flex items-center gap-1">
          <Switch defaultChecked={excludeCoreTeam} onCheckedChange={onCheckedChange} id="excludeCoreTeam" />
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
            <CheckboxGroup.Root defaultValue={['gnolang/gno', ...selectedRepositoriesId]} onValueChange={onValueChange}>
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
