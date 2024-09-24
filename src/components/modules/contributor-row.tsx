'use client';

import { useMemo } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { ExternalLinkIcon, StarFilledIcon } from '@radix-ui/react-icons';
import { Flex, Table } from '@radix-ui/themes';

import { cn } from '@/util/style';

import { UserWithStats } from '@/type/github';

export interface ContributorRowProps {
  contributor: UserWithStats;
  score: number;
  rank: number;
}

const ContributorRow = ({ contributor, score, rank }: ContributorRowProps) => {
  const router = useRouter();

  const rankElement = useMemo(() => {
    if (rank < 3)
      return (
        <StarFilledIcon
          className={cn(rank === 0 && 'text-yellow-10', rank === 1 && 'text-gray-10', rank === 2 && 'text-bronze-10')}
        />
      );
    return `${rank + 1} th`;
  }, [rank]);

  return (
    <Table.Row
      className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-grayA-2"
      onClick={() => router.push(contributor.url)}
      data-href={contributor.url}
      key={contributor.id}
    >
      <Table.Cell className="text-center">
        <Flex height="100%" align="center" justify="center">
          {rankElement}
        </Flex>
      </Table.Cell>
      <Table.Cell>
        <Flex width="100%" height="100%" align="center" gap="2">
          <Image
            src={contributor.avatarUrl}
            alt={`${contributor.login} avatar url`}
            height={24}
            width={24}
            className="overflow-hidden rounded-full"
          />

          {contributor.name ?? contributor.login}

          <ExternalLinkIcon className="text-blue-10" />
        </Flex>
      </Table.Cell>
      <Table.Cell className="text-center">{contributor.commits}</Table.Cell>
      <Table.Cell className="text-center">{contributor.issues}</Table.Cell>
      <Table.Cell className="text-center">{contributor.prs}</Table.Cell>
      <Table.Cell className="text-center font-bold">{score}</Table.Cell>
    </Table.Row>
  );
};

export default ContributorRow;
