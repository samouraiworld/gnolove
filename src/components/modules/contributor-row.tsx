'use client';

import { useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ExternalLinkIcon, MagnifyingGlassIcon, StarFilledIcon } from '@radix-ui/react-icons';
import { Badge, Flex, IconButton, Table, Text } from '@radix-ui/themes';
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
        <StarFilledIcon
          className={cn(rank === 0 && 'text-yellow-10', rank === 1 && 'text-gray-10', rank === 2 && 'text-bronze-10')}
        />
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
    <Table.Row className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-grayA-2" key={contributor.id}>
      {showRank && (
        <Cell className="text-center">
          <Flex height="100%" align="center" justify="center">
            {rankElement}
          </Flex>
        </Cell>
      )}

      <Cell maxWidth={{ initial: '50px', xs: '100px', sm: '150px' }}>
        <Flex width="100%" height="100%" align="center" gap="2">
          <Image
            src={contributor.avatarUrl}
            alt={`${contributor.login} avatar url`}
            height={24}
            width={24}
            className="shrink-0 overflow-hidden rounded-full"
          />

          <Link
            className={cn('min-w-0 max-w-[160px] xs:max-w-[180px] sm:max-w-none', isOffline && 'pointer-events-none')}
            href={isOffline ? '' : `/@${contributor.login}`}
          >
            <Text
              truncate
              title={contributor.name || contributor.login}
              className={cn('block overflow-hidden text-ellipsis whitespace-nowrap', isOffline && 'text-gray-8')}
              trim="both"
            >
              {contributor.name || contributor.login}
            </Text>
          </Link>

          {team && (
            <Badge color={team.color} size="1" className="hidden xs:inline">
              {team.name}
            </Badge>
          )}

          <Link href={`https://github.com/${contributor.login}`} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon className="shrink-0 text-blue-10" />
          </Link>
        </Flex>
      </Cell>

      {contributor.LastContribution && 'title' in contributor.LastContribution ? (
        <Cell onClick={onLastContributionClick} className="group hidden text-left lg:table-cell">
          <Flex width="100%" height="100%" align="center" gap="2" className="text-1">
            <Flex direction="column">
              <Flex align="center" gap="1">
                {/*<GitPullRequestIcon className="size-3 group-hover:text-accent-10" />*/}
                {/*<Text className="group-hover:text-accent-10">PR</Text>*/}

                <CircleDotIcon className="size-3 group-hover:text-accent-10" />
                <Text className="group-hover:text-accent-10">Last Contrib</Text>

                <Text color="gray">{formatDistanceToNow(contributor.LastContribution.createdAt)}</Text>
              </Flex>

              <Text color="gray" className="max-w-52 truncate">
                {contributor.LastContribution.title}
              </Text>
            </Flex>
          </Flex>
        </Cell>
      ) : (
        <Cell className="hidden text-left lg:table-cell">
          <Text color="gray">-</Text>
        </Cell>
      )}

      <Cell className="hidden text-center align-middle sm:table-cell">{contributor.TotalCommits}</Cell>

      <Cell className="hidden text-center align-middle sm:table-cell">{contributor.TotalIssues}</Cell>

      <Cell className="hidden text-center align-middle sm:table-cell">{contributor.TotalPrs}</Cell>

      <Cell className="text-center align-middle font-bold">{contributor.score.toFixed(2)}</Cell>

      <Cell className="text-center">
        <Flex height="100%" align="center" justify="center">
          <ContributionsDialog user={contributor}>
            <IconButton variant="ghost">
              <MagnifyingGlassIcon />
            </IconButton>
          </ContributionsDialog>
        </Flex>
      </Cell>
    </Table.Row>
  );
};

export default ContributorRow;
