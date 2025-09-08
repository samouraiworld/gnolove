'use client';

import { ExternalLink, Info } from 'lucide-react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import Label from '@/elements/label';

import { TIssue } from '@/utils/schemas';
import Cell from '@/elements/cell';

export interface IssuesTableProps extends React.ComponentProps<typeof Table> {
  issues: TIssue[];

  showHeader?: boolean;
  showLabels?: 'on-hover' | 'as-column';
}

const IssuesTable = ({ issues, showLabels, showHeader, ...props }: IssuesTableProps) => {
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
            {showLabels === 'as-column' && <TableHead>Labels</TableHead>}
          </TableRow>
        </TableHeader>
      )}

      <TableBody>
        {issues.map(({ id, title, labels, url }) => (
          <TableRow
            data-href={url}
            onClick={onClick.bind(null, url)}
            key={id}
            className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-muted/50"
          >
            <Cell className="max-w-0">
              <div className="w-full h-full flex items-center gap-2">
                <span className="w-full truncate">{title}</span>

                {showLabels === 'on-hover' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 shrink-0 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex flex-wrap gap-2">
                        {labels && labels.map((label) => <Label label={label} key={label.name + label.color} />)}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}

                <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
              </div>
            </Cell>

            {showLabels === 'as-column' && (
              <Cell>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <Label label={label} key={label.name + label.color} />
                  ))}
                </div>
              </Cell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default IssuesTable;
