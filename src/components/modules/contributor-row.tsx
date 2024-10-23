'use client';

import { useMemo } from 'react';

import Image from 'next/image';

import { ExternalLinkIcon, MagnifyingGlassIcon, StarFilledIcon } from '@radix-ui/react-icons';
import { Badge, Flex, IconButton, Table, Text } from '@radix-ui/themes';
import { formatDistanceToNow } from 'date-fns';
import { CircleDotIcon, GitPullRequestIcon } from 'lucide-react';

import ContributionsDialog from '@/module/contributions-dialog';

import { cmpCreatedAt } from '@/util/github';
import { cn } from '@/util/style';

import TEAMS from '@/constant/teams';

import { UserWithStats } from '@/type/github';

export interface ContributorRowProps {
  contributor: UserWithStats;
  score: number;
  rank: number;

  showRank?: boolean;
}

const ContributorRow = ({ contributor, score, rank, showRank }: ContributorRowProps) => {
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

  const lastContribution = useMemo(() => {
    return [
      ...contributor.prs.data.map((obj) => ({ ...obj, type: 'PULL_REQUEST' })),
      ...contributor.issues.data.map((obj) => ({ ...obj, type: 'ISSUE' })),
    ].toSorted(cmpCreatedAt)[0];
  }, [contributor]);

  const onClick = () => {
    if (typeof window === 'undefined') return;
    window.open(contributor.url, '_blank');
  };

  const onLastContributionClick = () => {
    if (typeof window === 'undefined' || !lastContribution) return;
    window.open(lastContribution.url, '_blank');
  };

  return (
    <Table.Row className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-grayA-2" key={contributor.id}>
      {showRank && (
        <Table.Cell data-href={contributor.url} onClick={onClick} className="text-center">
          <Flex height="100%" align="center" justify="center">
            {rankElement}
          </Flex>
        </Table.Cell>
      )}

      <Table.Cell data-href={contributor.url} onClick={onClick}>
        <Flex width="100%" height="100%" align="center" gap="2">
          <Image
            src={contributor.avatarUrl}
            alt={`${contributor.login} avatar url`}
            height={24}
            width={24}
            className="shrink-0 overflow-hidden rounded-full"
          />

          <Text className="whitespace-break-spaces text-wrap">{contributor.name ?? contributor.login}</Text>
          {team && (
            <Badge color={team.color} size="1">
              {team.name}
            </Badge>
          )}

          <ExternalLinkIcon className="shrink-0 text-blue-10" />
        </Flex>
      </Table.Cell>

      {lastContribution ? (
        <Table.Cell
          data-href={lastContribution.url}
          onClick={onLastContributionClick}
          className="group hidden text-left lg:table-cell"
        >
          <Flex width="100%" height="100%" align="center" gap="2" className="text-1">
            <Flex direction="column">
              <Flex align="center" gap="1">
                {lastContribution.type === 'ISSUE' ? (
                  <>
                    <CircleDotIcon className="size-3 group-hover:text-accent-10" />
                    <Text className="group-hover:text-accent-10">Issue</Text>
                  </>
                ) : (
                  <>
                    <GitPullRequestIcon className="size-3 group-hover:text-accent-10" />
                    <Text className="group-hover:text-accent-10">PR</Text>
                  </>
                )}

                <Text color="gray">{formatDistanceToNow(lastContribution.createdAt)}</Text>
              </Flex>

              <Text color="gray" className="max-w-52 truncate">
                {lastContribution.title}
              </Text>
            </Flex>
          </Flex>
        </Table.Cell>
      ) : (
        <Table.Cell data-href={contributor.url} onClick={onClick} className="hidden text-left lg:table-cell">
          <Text color="gray">-</Text>
        </Table.Cell>
      )}

      <Table.Cell
        data-href={contributor.url}
        onClick={onClick}
        className="hidden text-center align-middle sm:table-cell"
      >
        {contributor.commits}
      </Table.Cell>

      <Table.Cell
        data-href={contributor.url}
        onClick={onClick}
        className="hidden text-center align-middle sm:table-cell"
      >
        {contributor.issues.count}
      </Table.Cell>

      <Table.Cell
        data-href={contributor.url}
        onClick={onClick}
        className="hidden text-center align-middle sm:table-cell"
      >
        {contributor.prs.count} ({contributor.mrs.count})
      </Table.Cell>

      <Table.Cell data-href={contributor.url} onClick={onClick} className="text-center align-middle font-bold">
        {score.toFixed(2)}
      </Table.Cell>

      <Table.Cell className="text-center">
        <Flex height="100%" align="center" justify="center">
          <ContributionsDialog user={contributor}>
            <IconButton variant="ghost">
              <MagnifyingGlassIcon />
            </IconButton>
          </ContributionsDialog>
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
};

export default ContributorRow;
