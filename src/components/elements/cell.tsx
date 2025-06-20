import { Table } from '@radix-ui/themes';

const Cell = ({ children, ...props }: React.ComponentProps<typeof Table.Cell>) => (
  <Table.Cell p={{ initial: '1', xs: '1', sm: '3' }} {...props}>
    {children}
  </Table.Cell>
);

export default Cell;
