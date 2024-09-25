import Link from 'next/link';

import { Flex, FlexProps, TabNav } from '@radix-ui/themes';

import ContributorTable from '@/module/contributor-table';

import { isTimeFilter, TimeFilter } from '@/util/github';

import { UserWithStats } from '@/type/github';

export interface ScoreboardProps {
  contributors: UserWithStats[];
  timeFilter: TimeFilter;
}

const Scoreboard = ({ contributors, timeFilter, ...props }: ScoreboardProps & FlexProps) => {
  return (
    <Flex direction="column" {...props}>
      <TabNav.Root mb="4">
        {Object.keys(TimeFilter)
          .filter(isTimeFilter)
          .map((key) => (
            <TabNav.Link key={key} href={`?f=${key}`} active={timeFilter.toString() === TimeFilter[key]} asChild>
              <Link href={`?f=${key}`}>{TimeFilter[key]}</Link>
            </TabNav.Link>
          ))}
      </TabNav.Root>

      <ContributorTable contributors={contributors} sort showRank />
    </Flex>
  );
};

export default Scoreboard;
