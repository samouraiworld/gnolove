'use client';

import { ExternalLinkIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { Flex, HoverCard, Table, Text } from '@radix-ui/themes';

import Label from '@/element/label';

import { Issue } from '@/type/github';

export interface IssuesTableProps extends Table.RootProps {
  issues: Issue[];

  showHeader?: boolean;
  showLabels?: 'on-hover' | 'as-column';
}

const IssuesTable = ({ issues, showLabels, showHeader, ...props }: IssuesTableProps) => {
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
            {showLabels === 'as-column' && <Table.ColumnHeaderCell>Labels</Table.ColumnHeaderCell>}
          </Table.Row>
        </Table.Header>
      )}

      <Table.Body>
        {issues.map(({ id, title, url, labels }) => (
          <Table.Row
            data-href={url}
            onClick={onClick.bind(null, url)}
            key={id}
            className="cursor-pointer transition-all duration-300 ease-in-out hover:bg-grayA-2"
          >
            <Table.Cell className="max-w-0">
              <Flex width="100%" height="100%" align="center" gap="2">
                <Text className="w-full truncate">{title}</Text>

                {showLabels === 'on-hover' && (
                  <HoverCard.Root>
                    <HoverCard.Trigger>
                      <InfoCircledIcon className="shrink-0 text-blue-10" />
                    </HoverCard.Trigger>

                    <Flex gap="2" wrap="wrap" asChild>
                      <HoverCard.Content size="1">
                        {labels.map((label) => (
                          <Label label={label} key={label.name + label.color} />
                        ))}
                      </HoverCard.Content>
                    </Flex>
                  </HoverCard.Root>
                )}

                <ExternalLinkIcon className="shrink-0 text-blue-10" />
              </Flex>
            </Table.Cell>

            {showLabels === 'as-column' && (
              <Table.Cell>
                <Flex gap="2" wrap="wrap">
                  {labels.map((label) => (
                    <Label label={label} key={label.name + label.color} />
                  ))}
                </Flex>
              </Table.Cell>
            )}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default IssuesTable;
