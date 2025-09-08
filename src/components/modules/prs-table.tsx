'use client';

import { ExternalLink } from 'lucide-react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import Cell from '@/components/elements/cell';

import { TPullRequest } from '@/utils/schemas';

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
              className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-muted/50"
            >
              <Cell className="max-w-0">
                <div className="w-full h-full flex items-center gap-2">
                  <span className="w-full truncate">{title}</span>

                  <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
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
