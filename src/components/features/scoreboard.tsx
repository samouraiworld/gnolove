import Link from 'next/link';

import { Flex, FlexProps, Table, TabNav } from '@radix-ui/themes';

import ContributorRow from '@/module/contributor-row';

import { isTimeFilter, TimeFilter } from '@/util/github';
import { getSortedContributorsWithScore } from '@/util/score';

import { UserWithStats } from '@/type/github';

export interface ScoreboardProps {
  contributors: UserWithStats[];
  timeFilter: TimeFilter;
}

const Scoreboard = ({ contributors, timeFilter, ...props }: ScoreboardProps & FlexProps) => {
  const contributorsWithScore = getSortedContributorsWithScore(contributors).slice(0, 50);

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

      <Table.Root layout="auto">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell className="text-center">Rank</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="w-full">Username</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="hidden lg:table-cell">Last Activity</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="hidden text-center sm:table-cell">Commits</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="hidden text-center sm:table-cell">Issues</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="hidden text-center sm:table-cell">PRs (MRs)</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="text-center">Magic Power</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {contributorsWithScore.map(({ score, ...contributor }, rank) => (
            <ContributorRow key={contributor.id} {...{ contributor, score, rank }} />
          ))}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
};

export default Scoreboard;
