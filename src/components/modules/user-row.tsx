'use client';

import Image from 'next/image';

import { ExternalLinkIcon } from '@radix-ui/react-icons';
import { Flex, Table, Text } from '@radix-ui/themes';

import Cell from '@/components/elements/cell';

import { TUser } from '@/utils/schemas';

export interface UserRowProps {
  user: TUser;
}

const UserRow = ({ user }: UserRowProps) => {
  const onClick = () => {
    if (typeof window === 'undefined') return;
    window.open(user.url, '_blank');
  };

  return (
    <Table.Row className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-grayA-2" key={user.id}>
      <Cell data-href={user.url} onClick={onClick}>
        <Flex width="100%" height="100%" align="center" gap="2">
          <Image
            src={user.avatarUrl}
            alt={`${user.login} avatar url`}
            height={24}
            width={24}
            className="-my-1 shrink-0 overflow-hidden rounded-full"
          />

          <Text className="w-full truncate">{user.name || user.login}</Text>

          <ExternalLinkIcon className="shrink-0 text-blue-10" />
        </Flex>
      </Cell>
    </Table.Row>
  );
};

export default UserRow;
