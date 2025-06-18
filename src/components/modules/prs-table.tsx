'use client';

import { ExternalLinkIcon } from '@radix-ui/react-icons';
import { Flex, Table, Text } from '@radix-ui/themes';

import Cell from '@/components/elements/cell';

import { TPullRequest } from '@/util/schemas';

export interface IssuesTableProps extends Table.RootProps {
  prs: TPullRequest[];

  showHeader?: boolean;
}

const PrsTable = ({ prs, showHeader, ...props }: IssuesTableProps) => {
  const onClick = (url: string) => {
    if (typeof window === 'undefined') return;
    window.open(url, '_blank');
  };

  return (
    <Table.Root {...props}>
      {showHeader && (
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
      )}

      <Table.Body>
        {prs.map(({ id, title, url }) => {
          return (
            <Table.Row
              data-href={url}
              onClick={onClick.bind(null, url)}
              key={id}
              className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-grayA-2"
            >
              <Cell className="max-w-0">
                <Flex width="100%" height="100%" align="center" gap="2">
                  <Text className="w-full truncate">{title}</Text>

                  <ExternalLinkIcon className="shrink-0 text-blue-10" />
                </Flex>
              </Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
};

export default PrsTable;
