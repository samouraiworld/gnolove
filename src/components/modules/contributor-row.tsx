'use client';

import { useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ExternalLink, Star } from 'lucide-react';

import { useOffline } from '@/contexts/offline-context';

import { TEnhancedUserWithStats } from '@/utils/schemas';
import { cn } from '@/utils/style';

import TEAMS from '@/constants/teams';

import { Badge } from '@/components/ui/badge';
import { TableRow } from '@/components/ui/table';
import Cell from '@/elements/cell';
import ContributionsDialog from '@/modules/contributions-dialog';

export interface ContributorRowProps {
  contributor: TEnhancedUserWithStats;
  rank: number;

  showRank?: boolean;
}

const ContributorRow = ({ contributor, rank, showRank }: ContributorRowProps) => {
  const { isOffline } = useOffline();
  const rankElement = useMemo(() => {
    if (rank < 3)
      return (
        <Star
          className={cn(
            'h-4 w-4',
            rank === 0 && 'text-yellow-500',
            rank === 1 && 'text-gray-500',
            rank === 2 && 'text-amber-800',
          )}
        />
      );
    return `${rank + 1}th`;
  }, [rank]);

  const team = useMemo(() => {
    for (const TEAM of TEAMS) {
      if (TEAM.members.map((member) => member.toLowerCase()).includes(contributor.login.toLowerCase())) return TEAM;
    }

    return undefined;
  }, [contributor]);

  return (
    <TableRow className="hover:bg-muted/50 cursor-pointer transition-all duration-300 ease-in-out" key={contributor.id}>
      {showRank && (
        <Cell className="text-center">
          <div className="flex h-full items-center justify-center">{rankElement}</div>
        </Cell>
      )}

      <Cell>
        <div className="flex h-full w-full max-w-[150px] items-center gap-2 sm:max-w-none">
          <Image
            src={contributor.avatarUrl}
            alt={`${contributor.login} avatar url`}
            height={24}
            width={24}
            className="shrink-0 overflow-hidden rounded-full"
          />

          <Link
            className={cn('xs:max-w-[180px] max-w-[160px] min-w-0 sm:max-w-none', { 'pointer-events-none': isOffline })}
            href={isOffline ? '' : `/@${contributor.login}`}
          >
            <span
              title={contributor.name || contributor.login}
              className={cn('truncate', { 'text-muted-foreground': isOffline })}
            >
              {contributor.name || contributor.login}
            </span>
          </Link>

          {team && <Badge className="xs:inline hidden">{team.name}</Badge>}

          <Link href={`https://github.com/${contributor.login}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="text-primary h-4 w-4 shrink-0" />
          </Link>
        </div>
      </Cell>

      <Cell>
        <ContributionsDialog user={contributor}>
          <div className="text-right">
            <p className="font-medium text-sm">{contributor.score.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {contributor.TotalPrs} PRs • {contributor.TotalCommits} commits
            </p>
          </div>
        </ContributionsDialog>
      </Cell>
    </TableRow>
  );
};

export default ContributorRow;
