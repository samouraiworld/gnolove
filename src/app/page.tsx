import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';

import { Flex, ScrollArea, Table, TabNav } from '@radix-ui/themes';

import ContributorRow from '@/module/contributor-row';

import graphql from '@/instance/graphql';

import { getTimeFilterFromSearchParam, getUsersWithStats, isTimeFilter, TimeFilter } from '@/util/github';

import contributors from '@/constant/contributors';
import REPOSITORY from '@/constant/repository';

export const metadata: Metadata = {
  title: 'Top of Gnome',
};

const getCachedContributorsQuery = (timeFilter: TimeFilter) =>
  unstable_cache(
    async () => {
      // ! The request takes time to load. Only use the dynamic feature in the production environment to avoid slow
      // ! development process.
      if (process.env.NODE_ENV !== 'production') return contributors[timeFilter];

      try {
        // ! Keep the 'await' otherwise, the try-catch block is not triggered.
        return await getUsersWithStats(graphql, REPOSITORY, timeFilter);
      } catch (err) {
        console.error(err);

        // eslint-disable-next-line
        console.log('Failed to retrieve the contributors. Using the fallback file.');
        return contributors[timeFilter];
      }
    },
    ['contributors', timeFilter],
    { revalidate: 60 * 60 }, // 60 * 60 = 3600 secs = 1 hour
  );

export interface HomePageParams {
  searchParams: {
    f?: string | string[] | undefined;
  };
}

const HomePage = async ({ searchParams: { f } }: HomePageParams) => {
  const timeFilter = getTimeFilterFromSearchParam(f);
  const query = getCachedContributorsQuery(timeFilter);

  const cachedContributors = await query();

  const contributorsWithScore = cachedContributors
    .slice(0, 50)
    .map((row) => ({ ...row, score: row.commits + row.issues + row.prs }))
    .toSorted((a, b) => b.score - a.score);

  return (
    <Flex className="h-screen w-screen" asChild>
      <ScrollArea>
        <Flex direction="column" p="7" className="mx-auto w-full max-w-4xl">
          <TabNav.Root mb="4">
            {Object.keys(TimeFilter)
              .filter(isTimeFilter)
              .map((key) => (
                <TabNav.Link key={key} href={`?f=${key}`} active={timeFilter.toString() === TimeFilter[key]}>
                  {TimeFilter[key]}
                </TabNav.Link>
              ))}
          </TabNav.Root>

          <Table.Root layout="auto">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell className="w-full">Username</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className="text-center">Commits</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className="text-center">Issues</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className="text-center">PRs</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className="text-center">Score</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className="text-center">Rank</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {contributorsWithScore.map(({ score, ...contributor }, rank) => {
                return <ContributorRow key={contributor.id} {...{ contributor, score, rank }} />;
              })}
            </Table.Body>
          </Table.Root>
        </Flex>
      </ScrollArea>
    </Flex>
  );
};

export default HomePage;
