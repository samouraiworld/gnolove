'use client';

import { Card, Flex, Grid, Heading, Table, Text } from '@radix-ui/themes';
import { useMemo } from 'react';

import teams from '@/constants/teams';
import Link from 'next/link';
import { StarFilledIcon } from '@radix-ui/react-icons';
import { cn } from '@/util/style';

import useGetContributors from '@/hooks/use-get-contributors';
import { TimeFilter } from '@/utils/github';
import { getContributorsWithScore } from '@/utils/score';
import LayoutContainer from '@/components/layouts/layout-container';
import { useOffline } from '@/contexts/offline-context';
import Image from 'next/image';

const BestPerformingTeams = () => {
  const { isOffline } = useOffline();
  const { data: contributors } = useGetContributors({ timeFilter: TimeFilter.MONTHLY });

  const filteredContributors = useMemo(
    () => getContributorsWithScore(contributors ?? []).filter(({ score }) => score),
    [contributors],
  );

  const teamScores = useMemo(() =>
    teams.map(team => {
      // Map members to their score and login
      const membersWithScore = team.members.map(memberLogin => {
        const contributor = filteredContributors.find(c => c.login === memberLogin);
        return {
          avatarUrl: contributor?.avatarUrl,
          login: memberLogin,
          score: contributor?.score || 0,
        };
      });
      // Sort members by score descending
      const sortedMembers = membersWithScore.sort((a, b) => b.score - a.score);
      // Calculate total score
      const totalScore = membersWithScore.reduce((sum, m) => sum + m.score, 0);
      return { ...team, totalScore, members: sortedMembers };
    }).sort((a, b) => b.totalScore - a.totalScore)
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
        <Text size="2" align="center">(of last month)</Text>
        <Grid columns={{ initial: '1', md: '3' }} gap="3">
          {teamScores.map((team, rank) => (
            <Card key={team.name}>
              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  {rankElement(rank)}
                  <Heading size="4" weight="bold">{team.name}</Heading>
                </Flex>
                <Flex align="center" gap="4">
                  <Flex align="center" gap="2">
                    <Text size="2" weight="bold">Score: </Text>
                    <Text size="2">{team.totalScore}</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Text size="2" weight="bold">Members: </Text>
                    <Text size="2">{team.members.length}</Text>
                  </Flex>
                </Flex>
                <Table.Root>
                  <Table.Body>
                    {team.members.map((member) => (
                      <Table.Row key={member.login}>
                        <Table.Cell>
                          <Flex align="center" gap="2">
                            <Image
                              src={member.avatarUrl!}
                              alt={`${member.login} avatar`}
                              width={24}
                              height={24}
                              className="shrink-0 overflow-hidden rounded-full"
                            />
                            <Link href={isOffline ? '' : `/@${member}`}>
                              <Text truncate className={cn('block overflow-hidden text-ellipsis whitespace-nowrap hover:text-blue-10', isOffline && 'text-gray-8')}>{member.login}</Text>
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
          ))}
        </Grid>
      </Flex>
    </LayoutContainer>
  );
};

export default BestPerformingTeams;
