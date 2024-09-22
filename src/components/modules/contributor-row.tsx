'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { ExternalLinkIcon } from '@radix-ui/react-icons';
import { Flex, Table } from '@radix-ui/themes';

import { UserWithStats } from '@/type/github';

export interface ContributorRowProps {
  contributor: UserWithStats;
  score: number;
}

const ContributorRow = ({ contributor, score }: ContributorRowProps) => {
  const router = useRouter();

  return (
    <Table.Row
      className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-grayA-2"
      onClick={() => router.push(contributor.url)}
      data-href={contributor.url}
      key={contributor.id}
    >
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
