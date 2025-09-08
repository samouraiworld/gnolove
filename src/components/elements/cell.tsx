import React from 'react';
import { TableCell } from '@/components/ui/table';

const Cell = ({ children, className, ...props }: React.ComponentProps<typeof TableCell>) => (
  <TableCell className={`p-2 sm:p-3 ${className ?? ''}`} {...props}>
    {children}
  </TableCell>
);

export default Cell;
