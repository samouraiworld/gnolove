import { useMemo } from 'react';

import Image from 'next/image';

import { Flex, Table, Text, Tooltip } from '@radix-ui/themes';

import ContributorRow from '@/modules/contributor-row';

import { TEnhancedUserWithStatsAndScore } from '@/utils/schemas';
import { getSortedContributors } from '@/utils/score';

import SCORE from '@/constants/score';

import MinecraftHeart from '@/images/minecraft-heart.png';

export interface ContributorTableProps {
  contributors: TEnhancedUserWithStatsAndScore[];

  sort?: boolean;

  showRank?: boolean;
}

const ContributorTable = ({ contributors, sort, showRank }: ContributorTableProps) => {
  const tooltipContent = useMemo(() => {
    const values = {
      commits: SCORE.COMMIT_FACTOR,
      issues: SCORE.ISSUES_FACTOR,
      pull_requests: SCORE.PR_FACTOR,
      reviewed_merge_requests: SCORE.REVIEWED_MR_FACTOR,
    };

    const keys = Object.keys(values) as (keyof typeof values)[];
    const sortedKeys = keys.filter((k) => values[k]).sort((a, b) => values[b] - values[a]);
    const strKeys = sortedKeys.map((k) => `${k} * ${values[k]}`);

    return `score = ${strKeys.join(' + ')}`;
  }, [SCORE]);
  return (
    <Table.Root layout="auto">
      <Table.Header>
        <Table.Row>
          {showRank && <Table.ColumnHeaderCell className="text-center">Rank</Table.ColumnHeaderCell>}

          <Table.ColumnHeaderCell className="w-full">Username</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="hidden lg:table-cell">Last Activity</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="hidden text-center sm:table-cell">Commits</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="hidden text-center sm:table-cell">Issues</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="hidden text-center sm:table-cell">PRs</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-center">
            <Tooltip className="text-center font-mono" content={tooltipContent}>
              <Flex width="100%" height="100%" justify="center" align="center" gap="1">
                <Text className="hidden xs:inline">Gno Love Power</Text> <Image src={MinecraftHeart} alt="minecraft heart " width={12} height={12} />
              </Flex>
            </Tooltip>
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {(sort ? getSortedContributors(contributors) : contributors).slice(0, 50).map((contributor, rank) => (
          <ContributorRow key={contributor.id} {...{ contributor, rank, showRank }} />
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default ContributorTable;
