'use client';

import { useState } from 'react';
import { useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Masonry } from 'masonic';

import TimeRangeSelector from '@/modules/time-range-selector';

import Loader from '@/elements/loader';

import { useOffline } from '@/contexts/offline-context';

import useGetContributors from '@/hooks/use-get-contributors';
import useSelectedRepositories from '@/hooks/use-selected-repositories';

import { TimeFilter } from '@/utils/github';
import { cn } from '@/utils/style';

import teams from '@/constants/teams';

import LayoutContainer from '@/components/layouts/layout-container';
import { Star } from 'lucide-react';

const BestPerformingTeams = () => {
  const { isOffline } = useOffline();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(TimeFilter.ALL_TIME);
  const selectedRepositories = useSelectedRepositories();
  const { data: contributors, isPending } = useGetContributors({ timeFilter, repositories: selectedRepositories });

  const filteredContributors = useMemo(() => (contributors ?? []).filter(({ score }) => score), [contributors]);

  const teamScores = useMemo(
    () =>
      teams
        .map((team) => {
          // Map members to their score and login
          const membersWithScore: { avatarUrl: string; name: string; login: string; score: number }[] = [];
          for (const memberLogin of team.members) {
            const contributor = filteredContributors?.find((c) => c.login.toLowerCase() === memberLogin.toLowerCase());
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
        })
        .sort((a, b) => b.totalScore - a.totalScore)
        .filter(({ totalScore }) => totalScore > 0),
    [filteredContributors],
  );

  const rankElement = (rank: number) => {
    if (rank < 3)
      return (
        <Star
          className={cn(rank === 0 && 'text-yellow-10', rank === 1 && 'text-gray-10', rank === 2 && 'text-bronze-10')}
        />
      );
    return `${rank + 1}th`;
  };

  return (
    <LayoutContainer className="mt-5">
      <div className="flex flex-col gap-6 my-6">
        <h1 className="text-2xl font-bold text-center">🏆 Best Performing Teams</h1>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm">Showing:</span>
          <TimeRangeSelector onDateChange={setTimeFilter} defaultValue={timeFilter} showLabel={false} />
        </div>
        {isPending ? (
          <div className="flex my-9 justify-center align-center">
            <Loader />
          </div>
        ) : (
          <Masonry
            maxColumnCount={3}
            columnWidth={350}
            columnGutter={8}
            key={`${timeFilter}-${selectedRepositories.join(',')}`}
            items={teamScores}
            itemKey={(item) => item.name}
            overscanBy={teamScores.length}
            render={({ index, data: { name, totalScore, members } }) => (
              <Card className="break-inside-avoid" key={name}>
                <CardHeader>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {rankElement(index)}
                      <h2 className="text-lg font-semibold">{name}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Score:</span>
                        <span className="text-sm">{totalScore}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Members:</span>
                        <span className="text-sm">{members.length}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.login}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {member.avatarUrl ? (
                                <Image
                                  src={member.avatarUrl!}
                                  alt={`${member.login} avatar`}
                                  width={24}
                                  height={24}
                                  className="shrink-0 overflow-hidden rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-10" />
                              )}
                              <Link href={isOffline ? '' : `/@${member.login}`}>
                                <span
                                  className={cn(
                                    'hover:text-blue-10 block overflow-hidden text-ellipsis whitespace-nowrap truncate',
                                    { 'text-gray-8': isOffline },
                                  )}
                                >
                                  {member.name || member.login}
                                </span>
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell align="right">{member.score.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          />
        )}
      </div>
    </LayoutContainer>
  );
};

export default BestPerformingTeams;
