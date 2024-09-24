import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';

import { Flex, ScrollArea, Table } from '@radix-ui/themes';

import ContributorRow from '@/module/contributor-row';

import graphql from '@/instance/graphql';

import { getUsersWithStats } from '@/util/github';

import contributors from '@/constant/contributors';
import REPOSITORY from '@/constant/repository';

export const metadata: Metadata = {
  title: 'Top of Gnome',
};

const getCachedContributors = unstable_cache(
  async () => {
    // ! The request takes time to load. Only use the dynamic feature in the production environment to avoid slow
    // ! development process.
    if (process.env.NODE_ENV !== 'production') return contributors;
    return getUsersWithStats(graphql, REPOSITORY);
  },
  ['contributors'],
  { revalidate: 60 * 60 }, // 60 * 60 = 3600 secs = 1 hour
);

const HomePage = async () => {
  const cachedContributors = await getCachedContributors();

  const contributorsWithScore = cachedContributors
    .slice(0, 50)
    .map((row) => ({ ...row, score: row.commits + row.issues + row.prs }))
    .toSorted((a, b) => b.score - a.score);

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
