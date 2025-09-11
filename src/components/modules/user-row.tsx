'use client';

import Image from 'next/image';

import { ExternalLink } from 'lucide-react';

import { TUser } from '@/utils/schemas';

import Cell from '@/components/elements/cell';
import { TableRow } from '@/components/ui/table';

export interface UserRowProps {
  user: TUser;
}

const UserRow = ({ user }: UserRowProps) => {
  const onClick = () => {
    if (typeof window === 'undefined') return;
    window.open(user.url, '_blank');
  };

  return (
    <TableRow className="hover:bg-muted/50 cursor-pointer transition-all duration-300 ease-in-out" key={user.id}>
      <Cell data-href={user.url} onClick={onClick}>
        <div className="flex h-full w-full items-center gap-2">
          <Image
            src={user.avatarUrl}
            alt={`${user.login} avatar url`}
            height={24}
            width={24}
            className="-my-1 shrink-0 overflow-hidden rounded-full"
          />

          <span className="w-full truncate">{user.name || user.login}</span>

          <ExternalLink className="text-primary h-4 w-4 shrink-0" />
        </div>
      </Cell>
    </TableRow>
  );
};

export default UserRow;
