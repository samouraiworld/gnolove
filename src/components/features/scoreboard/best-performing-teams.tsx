'use client';

import { useState } from 'react';
import { Box, Card, Flex, Heading, Table, Text } from '@radix-ui/themes';
import { useMemo } from 'react';

import teams from '@/constants/teams';
import Link from 'next/link';
import { StarFilledIcon } from '@radix-ui/react-icons';
import { cn } from '@/utils/style';

import useGetContributors from '@/hooks/use-get-contributors';
import { TimeFilter } from '@/utils/github';
import LayoutContainer from '@/components/layouts/layout-container';
import { useOffline } from '@/contexts/offline-context';
import Image from 'next/image';
import { Masonry } from 'masonic';
import useGetRepositories from '@/hooks/use-get-repositories';
import RepositoriesSelector from '@/modules/repositories-selector';
import TimeRangeSelector from '@/modules/time-range-selector';
import Loader from '@/elements/loader';

const BestPerformingTeams = () => {
  const { isOffline } = useOffline();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(TimeFilter.ALL_TIME);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
  const { data: repositories = [] } = useGetRepositories();
  const { data: contributors, isPending } = useGetContributors({ timeFilter, repositories: selectedRepositories });

  const filteredContributors = useMemo(
    () => contributors?.filter(({ score }) => score),
    [contributors],
  );

  const teamScores = useMemo(() =>
    teams.map(team => {
      // Map members to their score and login
      const membersWithScore: { avatarUrl: string; name: string; login: string; score: number }[] = []; 
      for (const memberLogin of team.members) {
        const contributor = filteredContributors?.find(c => c.login.toLowerCase() === memberLogin.toLowerCase());
        if (!contributor) continue;
        membersWithScore.push({
          avatarUrl: contributor.avatarUrl,
          name: contributor.name,
          login: contributor.login,
          score: contributor.score,
        });
      }
      // Sort members by score descending
      const sortedMembers = membersWithScore.sort((a, b) => b.score - a.score);
      // Calculate total score
      const totalScore = membersWithScore.reduce((sum, m) => sum + m.score, 0);
      return { ...team, totalScore, members: sortedMembers };
    }).sort((a, b) => b.totalScore - a.totalScore).filter(({ totalScore }) => totalScore > 0)
  , [filteredContributors]);

  const rankElement = (rank: number) => {
    if (rank < 3)
      return (
        <StarFilledIcon
          className={cn(rank === 0 && 'text-yellow-10', rank === 1 && 'text-gray-10', rank === 2 && 'text-bronze-10')}
        />
      );
    return `${rank + 1}th`;
  };

  return (
    <LayoutContainer mt="5">
      <Flex direction="column" gap="6" my="6">
        <Heading size="6" align="center">🏆 Best Performing Teams</Heading>
        <Flex align="center" justify="center" gap="2">
          <Text size="2">Showing:</Text>
          <TimeRangeSelector onDateChange={setTimeFilter} defaultValue={timeFilter} showLabel={false} />
          <Text size="2">for:</Text>
          <RepositoriesSelector
            repositories={repositories}
            selectedRepositories={selectedRepositories}
            onSelectedRepositoriesChange={setSelectedRepositories}
            defaultCheckedIds={['gnolang/gno']}
          />
        </Flex>
        {isPending ? (
          <Flex my="9" justify="center" align="center">
            <Loader />
          </Flex>
        ) : (
          <Masonry
            maxColumnCount={3}
            columnWidth={350}
            columnGutter={8}
            key={`${timeFilter}-${selectedRepositories.join(',')}`}
            items={teamScores}
            render={({index, data: { name, totalScore, members }}) => (
              <Card className="break-inside-avoid" key={name}>
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="2">
                    {rankElement(index)}
                    <Heading size="4" weight="bold">{name}</Heading>
                  </Flex>
                  <Flex align="center" gap="4">
                    <Flex align="center" gap="2">
                      <Text size="2" weight="bold">Score: </Text>
                      <Text size="2">{totalScore}</Text>
                    </Flex>
                    <Flex align="center" gap="2">
                      <Text size="2" weight="bold">Members: </Text>
                      <Text size="2">{members.length}</Text>
                    </Flex>
                  </Flex>
                  <Table.Root>
                    <Table.Body>
                      {members.map((member) => (
                        <Table.Row key={member.login}>
                          <Table.Cell>
                            <Flex align="center" gap="2">
                              {member.avatarUrl ? (
                                <Image
                                  src={member.avatarUrl!}
                                  alt={`${member.login} avatar`}
                                  width={24}
                                  height={24}
                                  className="shrink-0 overflow-hidden rounded-full"
                                />
                              ) : (
                                <Box width="24" height="24" />
                              )}
                              <Link href={isOffline ? '' : `/@${member.login}`}>
                                <Text truncate className={cn('block overflow-hidden text-ellipsis whitespace-nowrap hover:text-blue-10', isOffline && 'text-gray-8')}>{member.name || member.login}</Text>
                              </Link>
                            </Flex>
                          </Table.Cell>
                          <Table.Cell align="right">{member.score.toFixed(2)}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Flex>
              </Card>
            )}
          />
        )}
      </Flex>
    </LayoutContainer>
  );
};

export default BestPerformingTeams;
