import Image from 'next/image';

import { Flex, Table } from '@radix-ui/themes';

import ContributorRow from '@/module/contributor-row';

import { getSortedContributors } from '@/util/score';

import { UserWithStatsAndScore } from '@/type/github';

import MinecraftHeart from '@/image/minecraft-heart.png';

export interface ContributorTableProps {
  contributors: UserWithStatsAndScore[];

  sort?: boolean;

  showRank?: boolean;
}

const ContributorTable = ({ contributors, sort, showRank }: ContributorTableProps) => {
  return (
    <Table.Root layout="auto">
      <Table.Header>
        <Table.Row>
          {showRank && <Table.ColumnHeaderCell className="text-center">Rank</Table.ColumnHeaderCell>}

          <Table.ColumnHeaderCell className="w-full">Username</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="hidden lg:table-cell">Last Activity</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="hidden text-center sm:table-cell">Commits</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="hidden text-center sm:table-cell">Issues</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="hidden text-center sm:table-cell">PRs (MRs)</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-center">
            <Flex width="100%" height="100%" justify="center" align="center" gap="1">
              Gno Love Power <Image src={MinecraftHeart} alt="minecraft heart " width={12} height={12} />
            </Flex>
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {(sort ? getSortedContributors(contributors) : contributors)
          .slice(0, 50)
          .map(({ score, ...contributor }, rank) => (
            <ContributorRow key={contributor.id} {...{ contributor, score, rank, showRank }} />
          ))}
      </Table.Body>
    </Table.Root>
  );
};

export default ContributorTable;
