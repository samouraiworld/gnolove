import { useMemo } from 'react';

import { Metadata } from 'next';

import { Flex, ScrollArea, Table } from '@radix-ui/themes';

import ContributorRow from '@/module/contributor-row';

import contributors from '@/constant/contributors';

export const metadata: Metadata = {
  title: 'Top of Gnome',
};

const HomePage = () => {
  const contributorsWithScore = useMemo(() => {
    return contributors
      .map((row) => ({ ...row, score: row.commits + row.issues + row.prs }))
      .toSorted((a, b) => b.score - a.score);
  }, [contributors]);

  return (
    <Flex className="h-screen w-screen" asChild>
      <ScrollArea>
        <Flex direction="column" p="7" justify="center" align="center">
          <Table.Root layout="auto" className="w-full max-w-4xl">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell className="w-full">Username</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className="text-center">Commits</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className="text-center">Issues</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className="text-center">PRs</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className="text-center">Score</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {contributorsWithScore.map(({ score, ...contributor }) => {
                return <ContributorRow key={contributor.id} {...{ contributor, score }} />;
              })}
            </Table.Body>
          </Table.Root>
        </Flex>
      </ScrollArea>
    </Flex>
  );
};

export default HomePage;
