import { Table } from '@radix-ui/themes';

import UserRow from '@/modules/user-row';

import { TUser } from '@/utils/schemas';

export interface UserTableProps {
  users: TUser[];

  showHeader?: boolean;
}

const UserTable = ({ users, showHeader }: UserTableProps) => {
  return (
    <Table.Root layout="auto">
      {showHeader && (
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell className="w-full">Username</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
      )}

      <Table.Body>
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default UserTable;
