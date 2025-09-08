import { useMemo } from 'react';

import Image from 'next/image';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import ContributorRow from '@/modules/contributor-row';

import { TEnhancedUserWithStats } from '@/utils/schemas';

import useGetScoreFactors from '@/hooks/use-get-score-factors';

import MinecraftHeart from '@/images/minecraft-heart.png';

export interface ContributorTableProps {
  contributors: TEnhancedUserWithStats[];

  sort?: boolean;

  showRank?: boolean;
}

const ContributorTable = ({ contributors, sort, showRank }: ContributorTableProps) => {
  const { data: scoreFactors } = useGetScoreFactors();

  const tooltipContent = useMemo(() => {
    const values = {
      commits: scoreFactors?.commitFactor ?? 0,
      issues: scoreFactors?.issueFactor ?? 0,
      pull_requests: scoreFactors?.prFactor ?? 0,
      reviewed_merge_requests: scoreFactors?.reviewedPrFactor ?? 0,
    };

    const keys = Object.keys(values) as (keyof typeof values)[];
    const sortedKeys = keys.filter((k) => values[k]).sort((a, b) => values[b] - values[a]);
    const strKeys = sortedKeys.map((k) => `${k} * ${values[k]}`);

    return `score = ${strKeys.join(' + ')}`;
  }, [scoreFactors]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showRank && <TableHead className="text-center">Rank</TableHead>}

          <TableHead className="w-full">Username</TableHead>
          <TableHead className="hidden lg:table-cell">Last Activity</TableHead>
          <TableHead className="hidden text-center sm:table-cell">Commits</TableHead>
          <TableHead className="hidden text-center sm:table-cell">Issues</TableHead>
          <TableHead className="hidden text-center sm:table-cell">PRs</TableHead>
          <TableHead className="text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full h-full flex justify-center items-center gap-1">
                  <span className="hidden xs:inline">Gno Love Power</span>
                  <Image src={MinecraftHeart} alt="minecraft heart " width={12} height={12} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="font-mono text-center">
                {tooltipContent}
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {(sort ? contributors.sort((a, b) => b.score - a.score) : contributors).slice(0, 50).map((contributor, rank) => (
          <ContributorRow key={contributor.id} {...{ contributor, rank, showRank }} />
        ))}
      </TableBody>
    </Table>
  );
};

export default ContributorTable;
