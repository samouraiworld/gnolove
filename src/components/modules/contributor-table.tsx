import { Table } from '@radix-ui/themes';

import ContributorRow from '@/module/contributor-row';

import { getContributorsWithScore, getSortedContributorsWithScore } from '@/util/score';

import { UserWithStats } from '@/type/github';

export interface ContributorTableProps {
  contributors: UserWithStats[];

  sort?: boolean;

  showRank?: boolean;
}

const ContributorTable = ({ contributors, sort, showRank }: ContributorTableProps) => {
  const contributorsWithScore = sort
    ? getSortedContributorsWithScore(contributors)
    : getContributorsWithScore(contributors);

  const slicedContributorsWithScore = contributorsWithScore.slice(0, 50);

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
          <Table.ColumnHeaderCell className="text-center">Magic Power</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {slicedContributorsWithScore.map(({ score, ...contributor }, rank) => (
          <ContributorRow key={contributor.id} {...{ contributor, score, rank, showRank }} />
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default ContributorTable;
