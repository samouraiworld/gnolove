'use client';

import { ExternalLink } from 'lucide-react';

import { TPullRequest } from '@/utils/schemas';

import Cell from '@/components/elements/cell';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface IssuesTableProps extends React.ComponentProps<typeof Table> {
  prs: TPullRequest[];

  showHeader?: boolean;
}

const PrsTable = ({ prs, showHeader, ...props }: IssuesTableProps) => {
  const onClick = (url: string) => {
    if (typeof window === 'undefined') return;
    window.open(url, '_blank');
  };

  return (
    <Table {...props}>
      {showHeader && (
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
          </TableRow>
        </TableHeader>
      )}

      <TableBody>
        {prs.map(({ id, title, url }) => {
          return (
            <TableRow
              data-href={url}
              onClick={onClick.bind(null, url)}
              key={id}
              className="hover:bg-muted/50 cursor-pointer transition-all duration-300 ease-in-out"
            >
              <Cell className="max-w-0">
                <div className="flex h-full w-full items-center gap-2">
                  <span className="w-full truncate">{title}</span>

                  <ExternalLink className="text-primary h-4 w-4 shrink-0" />
                </div>
              </Cell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default PrsTable;
