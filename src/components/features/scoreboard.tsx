'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Badge, Flex, FlexProps, Switch, TabNav, Text } from '@radix-ui/themes';

import ContributorTable from '@/module/contributor-table';

import { isTimeFilter, TimeFilter } from '@/util/github';
import { TEnhancedUserWithStatsAndScore } from '@/util/schemas';

export interface ScoreboardProps {
  contributors: TEnhancedUserWithStatsAndScore[];
  timeFilter: TimeFilter;
  excludeCoreTeam: boolean;
}

const Scoreboard = ({ contributors, timeFilter, excludeCoreTeam, ...props }: ScoreboardProps & FlexProps) => {
  const router = useRouter();

  const getSearchParams = (f: string, e: boolean) => {
    const searchParams = new URLSearchParams();
    searchParams.set('f', f);
    if (e) searchParams.set('e', '1');
    return searchParams;
  };

  const onCheckedChange = (value: boolean) => {
    const search = getSearchParams(timeFilter, value);
    router.push(`?${search.toString()}`);
  };

  return (
    <Flex direction="column" {...props}>
      <TabNav.Root justify="center" mb="4">
        {Object.keys(TimeFilter)
          .filter(isTimeFilter)
          .map((key) => {
            const href = `?${getSearchParams(key, excludeCoreTeam)}`;
            const active = timeFilter.toString() === TimeFilter[key];

            return (
              <TabNav.Link key={key} {...{ href, active }} asChild>
                <Link href={href}>{TimeFilter[key]}</Link>
              </TabNav.Link>
            );
          })}
      </TabNav.Root>

      <label htmlFor="excludeCoreTeam" className="my-2 flex items-center gap-1">
        <Switch defaultChecked={excludeCoreTeam} onCheckedChange={onCheckedChange} id="excludeCoreTeam" />
        <span className="flex items-center gap-2">
          Hide the
          <Badge>Core team</Badge>
        </span>
      </label>

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
