'use client';

import { ExternalLinkIcon } from '@radix-ui/react-icons';
import { Flex, Table } from '@radix-ui/themes';

import Label from '@/element/label';

import { Issue } from '@/type/github';

export interface IssuesTableProps extends Table.RootProps {
  issues: Issue[];
}

const IssuesTable = ({ issues, ...props }: IssuesTableProps) => {
  const onClick = (url: string) => {
    if (typeof window === 'undefined') return;
    window.open(url, '_blank');
  };

  return (
    <Table.Root {...props}>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Labels</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {issues.map(({ id, title, url, labels }) => (
          <Table.Row
            data-href={url}
            onClick={onClick.bind(null, url)}
            key={id}
            className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-grayA-2"
          >
            <Table.Cell className="!whitespace-normal text-wrap">
              <Flex width="100%" height="100%" align="center" gap="2">
                {title}
                <ExternalLinkIcon className="shrink-0 text-blue-10" />
              </Flex>
            </Table.Cell>
            <Table.Cell>
              <Flex gap="2" wrap="wrap">
                {labels.map((label) => (
                  <Label label={label} key={label.name + label.color} />
                ))}
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default IssuesTable;
