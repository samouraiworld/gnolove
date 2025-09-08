'use client';

import { useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ExternalLink, Search, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { CircleDotIcon } from 'lucide-react';

import ContributionsDialog from '@/modules/contributions-dialog';

import Cell from '@/elements/cell';

import { useOffline } from '@/contexts/offline-context';

import { TEnhancedUserWithStats } from '@/utils/schemas';
import { cn } from '@/utils/style';

import TEAMS from '@/constants/teams';

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
        <Star className={cn('h-4 w-4', rank === 0 && 'text-yellow-500', rank === 1 && 'text-gray-500', rank === 2 && 'text-amber-800')} />
      );
    return `${rank + 1} th`;
  }, [rank]);

  const team = useMemo(() => {
    for (const TEAM of TEAMS) {
      if (TEAM.members.map((member) => member.toLowerCase()).includes(contributor.login.toLowerCase())) return TEAM;
    }

    return undefined;
  }, [contributor]);

  const onLastContributionClick = () => {
    if (typeof window === 'undefined' || !contributor.LastContribution) return;
    window.open(contributor.LastContribution.url, '_blank');
  };

  return (
    <TableRow className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-muted/50" key={contributor.id}>
      {showRank && (
        <Cell className="text-center">
          <div className="h-full flex items-center justify-center">{rankElement}</div>
        </Cell>
      )}

      <Cell>
        <div className="w-full h-full flex items-center gap-2 max-w-[150px] sm:max-w-none">
          <Image
            src={contributor.avatarUrl}
            alt={`${contributor.login} avatar url`}
            height={24}
            width={24}
            className="shrink-0 overflow-hidden rounded-full"
          />

          <Link
            className={cn('min-w-0 max-w-[160px] xs:max-w-[180px] sm:max-w-none', { 'pointer-events-none': isOffline })}
            href={isOffline ? '' : `/@${contributor.login}`}
          >
            <span title={contributor.name || contributor.login} className={cn('truncate', { 'text-muted-foreground': isOffline })}>
              {contributor.name || contributor.login}
            </span>
          </Link>

          {team && (
            <Badge className="hidden xs:inline">
              {team.name}
            </Badge>
          )}

          <Link href={`https://github.com/${contributor.login}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
          </Link>
        </div>
      </Cell>

      {contributor.LastContribution && 'title' in contributor.LastContribution ? (
        <Cell onClick={onLastContributionClick} className="group hidden text-left lg:table-cell">
          <div className="w-full h-full flex items-center gap-2 text-sm">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <CircleDotIcon className="size-3 group-hover:text-primary" />
                <span className="group-hover:text-primary">Last Contrib</span>

                <span className="text-muted-foreground">{formatDistanceToNow(contributor.LastContribution.createdAt)}</span>
              </div>

              <span className="text-muted-foreground max-w-52 truncate">
                {contributor.LastContribution.title}
              </span>
            </div>
          </div>
        </Cell>
      ) : (
        <Cell className="hidden text-left lg:table-cell">
          <span className="text-muted-foreground">-</span>
        </Cell>
      )}

      <Cell className="hidden text-center align-middle sm:table-cell">{contributor.TotalCommits}</Cell>

      <Cell className="hidden text-center align-middle sm:table-cell">{contributor.TotalIssues}</Cell>

      <Cell className="hidden text-center align-middle sm:table-cell">{contributor.TotalPrs}</Cell>

      <Cell className="text-center align-middle font-bold">{contributor.score.toFixed(2)}</Cell>

      <Cell className="text-center">
        <div className="h-full flex items-center justify-center">
          <ContributionsDialog user={contributor}>
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </ContributionsDialog>
        </div>
      </Cell>
    </TableRow>
  );
};

export default ContributorRow;
