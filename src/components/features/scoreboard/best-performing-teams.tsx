'use client';

import { useState } from 'react';
import { Box, Card, Flex, Heading, Table, Text, Select, Popover, Button, CheckboxGroup } from '@radix-ui/themes';
import { useMemo } from 'react';

import teams from '@/constants/teams';
import Link from 'next/link';
import { MixerHorizontalIcon, StarFilledIcon } from '@radix-ui/react-icons';
import { cn } from '@/util/style';

import useGetContributors from '@/hooks/use-get-contributors';
import { TimeFilter } from '@/utils/github';
import { getContributorsWithScore } from '@/utils/score';
import LayoutContainer from '@/components/layouts/layout-container';
import { useOffline } from '@/contexts/offline-context';
import Image from 'next/image';
import { Masonry } from 'masonic';
import useGetRepositories from '@/hooks/use-get-repositories';

const BestPerformingTeams = () => {
  const { isOffline } = useOffline();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(TimeFilter.ALL_TIME);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
  const { data: repositories = [] } = useGetRepositories();
  const { data: contributors } = useGetContributors({ timeFilter, repositories: selectedRepositories });

  const filteredContributors = useMemo(
    () => getContributorsWithScore(contributors ?? []).filter(({ score }) => score),
    [contributors],
  );

  const teamScores = useMemo(() =>
    teams.map(team => {
      // Map members to their score and login
      const membersWithScore: { avatarUrl: string; name: string; login: string; score: number }[] = []; 
      for (const memberLogin of team.members) {
        const contributor = filteredContributors.find(c => c.login.toLowerCase() === memberLogin.toLowerCase());
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
          <Select.Root value={timeFilter} onValueChange={val => setTimeFilter(val as TimeFilter)}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value={TimeFilter.ALL_TIME}>All time</Select.Item>
              <Select.Item value={TimeFilter.YEARLY}>Yearly</Select.Item>
              <Select.Item value={TimeFilter.MONTHLY}>Monthly</Select.Item>
              <Select.Item value={TimeFilter.WEEKLY}>Weekly</Select.Item>
            </Select.Content>
          </Select.Root>
          <Text size="2">for:</Text>
          <Popover.Root>
            <Popover.Trigger>
              <Button variant="soft">
                <MixerHorizontalIcon />
                Repositories
              </Button>
            </Popover.Trigger>
  
            <Popover.Content>
              <CheckboxGroup.Root value={selectedRepositories} onValueChange={setSelectedRepositories}>
                {repositories.map(({ id, name, owner }) => (
                  <CheckboxGroup.Item disabled={id === 'gnolang/gno'} value={id} key={id}>
                    {owner}/{name}
                  </CheckboxGroup.Item>
                ))}
              </CheckboxGroup.Root>
            </Popover.Content>
          </Popover.Root>
        </Flex>
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
      </Flex>
    </LayoutContainer>
  );
};

export default BestPerformingTeams;
