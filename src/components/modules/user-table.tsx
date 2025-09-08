import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import UserRow from '@/modules/user-row';

import { TUser } from '@/utils/schemas';

export interface UserTableProps {
  users: TUser[];

  showHeader?: boolean;
}

const UserTable = ({ users, showHeader }: UserTableProps) => {
  return (
    <Table>
      {showHeader && (
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">Username</TableHead>
          </TableRow>
        </TableHeader>
      )}

      <TableBody>
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTable;
