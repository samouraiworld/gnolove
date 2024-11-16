import Link from 'next/link';

import { Flex, FlexProps, TabNav, Text } from '@radix-ui/themes';

import ContributorTable from '@/module/contributor-table';

import { isTimeFilter, TimeFilter } from '@/util/github';
import { TEnhancedUserWithStatsAndScore } from '@/util/schemas';

export interface ScoreboardProps {
  contributors: TEnhancedUserWithStatsAndScore[];
  timeFilter: TimeFilter;
}

const Scoreboard = ({ contributors, timeFilter, ...props }: ScoreboardProps & FlexProps) => {
  return (
    <Flex direction="column" {...props}>
      <TabNav.Root justify="center" mb="4">
        {Object.keys(TimeFilter)
          .filter(isTimeFilter)
          .map((key) => (
            <TabNav.Link key={key} href={`?f=${key}`} active={timeFilter.toString() === TimeFilter[key]} asChild>
              <Link href={`?f=${key}`}>{TimeFilter[key]}</Link>
            </TabNav.Link>
          ))}
      </TabNav.Root>

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
