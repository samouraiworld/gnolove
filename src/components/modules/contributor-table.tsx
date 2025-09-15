import ContributorRow from '@/modules/contributor-row';

import { TEnhancedUserWithStats } from '@/utils/schemas';

import { Table, TableBody } from '@/components/ui/table';

export interface ContributorTableProps {
  contributors: TEnhancedUserWithStats[];

  sort?: boolean;

  showRank?: boolean;
}

const ContributorTable = ({ contributors, sort, showRank }: ContributorTableProps) => {
  return (
    <Table>
      <TableBody>
        {(sort ? contributors.sort((a, b) => b.score - a.score) : contributors)
          .slice(0, 50)
          .map((contributor, rank) => (
            <ContributorRow key={contributor.id} {...{ contributor, rank, showRank }} />
          ))}
      </TableBody>
    </Table>
  );
};

export default ContributorTable;
