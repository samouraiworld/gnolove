'use client';

import { useState, useMemo, useEffect } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PersonIcon,
} from '@radix-ui/react-icons';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  ScrollArea,
  Separator,
} from '@radix-ui/themes';
import { endOfWeek, subWeeks, addWeeks, format, isAfter, getWeek, setWeek, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';

import RepositoriesSelector from '@/modules/repositories-selector';

import Loader from '@/elements/loader';

import { useOffline } from '@/contexts/offline-context';

import useGetPullRequestsReport from '@/hooks/use-get-pullrequests-report';
import useGetRepositories from '@/hooks/use-get-repositories';

import { TPullRequest } from '@/utils/schemas';

import TEAMS from '@/constants/teams';

import LayoutContainer from '@/components/layouts/layout-container';
import TeamSelector from '@/modules/team-selector';
import RepoPRStatusList from './repo-pr-status-list';

type RepoStatusMap = {
  [repo: string]: {
    [status: string]: TPullRequest[];
  };
};

export type Status = 'blocked' | 'in_progress' | 'merged' | 'reviewed' | 'waiting_for_review';

export const STATUS_ORDER: Status[] = ['waiting_for_review', 'in_progress', 'reviewed', 'merged', 'blocked'];

function groupPRsByRepoAndStatus(
  pullRequests: Record<Status, TPullRequest[]>,
  selectedRepositories: string[],
  teamMembers: string[],
): { repoStatusMap: RepoStatusMap; foundAny: boolean } {
  const repoStatusMap: RepoStatusMap = {};
  let foundAny = false;
  STATUS_ORDER.forEach((status) => {
    const prs = (pullRequests || {})[status] || [];
    prs.forEach((pr) => {
      const repo = selectedRepositories.find((r) => pr.url.includes(r));
      if (!repo) return;
      if (pr.authorLogin && !teamMembers.includes(pr.authorLogin)) return;
      if (!repoStatusMap[repo]) repoStatusMap[repo] = {};
      if (!repoStatusMap[repo][status]) repoStatusMap[repo][status] = [];
      repoStatusMap[repo][status].push(pr);
      foundAny = true;
    });
  });
  return { repoStatusMap, foundAny };
}

const ReportClientPage = () => {
  const { isOffline } = useOffline();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialWeek = Number(searchParams.get('week'));
  const initialRefDate =
    !Number.isNaN(initialWeek) && initialWeek >= 1 && initialWeek <= 53
      ? setWeek(new Date(), initialWeek, { weekStartsOn: 0, firstWeekContainsDate: 1 })
      : new Date();
  const [startDate, setStartDate] = useState<Date>(startOfWeek(initialRefDate, { weekStartsOn: 0 }));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(initialRefDate, { weekStartsOn: 0 }));
  const [selectedTeams, setSelectedTeams] = useState<string[]>(['Core Team']);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(['gnolang/gno']);

  const { data: repositories = [] } = useGetRepositories();
  const { data: pullRequests, isPending } = useGetPullRequestsReport({ startDate, endDate });

  // Sync week with URL: initialize from ?week= and update URL when week changes via navigation buttons
  useEffect(() => {
    const weekParam = Number(searchParams.get('week'));
    if (!Number.isNaN(weekParam) && weekParam >= 1 && weekParam <= 53) {
      const targetEnd = endOfWeek(
        setWeek(new Date(), weekParam, { weekStartsOn: 0, firstWeekContainsDate: 1 }),
        { weekStartsOn: 0 },
      );
      const targetStart = startOfWeek(targetEnd, { weekStartsOn: 0 });
      setStartDate(targetStart);
      setEndDate(targetEnd);
    } else {
      // Ensure URL reflects current week if missing/invalid
      const currentWeek = getWeek(endDate, { weekStartsOn: 0, firstWeekContainsDate: 1 });
      const params = new URLSearchParams(searchParams.toString());
      params.set('week', String(currentWeek));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, []);

  const pushWeekToUrl = (date: Date) => {
    const week = getWeek(date, { weekStartsOn: 0, firstWeekContainsDate: 1 });
    const params = new URLSearchParams(searchParams.toString());
    params.set('week', String(week));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePreviousWeek = () => {
    const targetEnd = endOfWeek(subWeeks(endDate, 1), { weekStartsOn: 0 });
    const targetStart = startOfWeek(targetEnd, { weekStartsOn: 0 });
    setStartDate(targetStart);
    setEndDate(targetEnd);
    pushWeekToUrl(targetEnd);
  };

  const handleNextWeek = () => {
    const targetEnd = endOfWeek(addWeeks(endDate, 1), { weekStartsOn: 0 });
    if (!isAfter(targetEnd, endOfWeek(new Date(), { weekStartsOn: 0 }))) {
      const targetStart = startOfWeek(targetEnd, { weekStartsOn: 0 });
      setStartDate(targetStart);
      setEndDate(targetEnd);
      pushWeekToUrl(targetEnd);
    }
  };

  const teamRepoStatusMap = useMemo(() => {
    if (!pullRequests) return { map: {}, foundAny: false };

    const map: Record<string, RepoStatusMap> = {};
    let foundAny = false;

    selectedTeams.forEach((teamName) => {
      const team = TEAMS.find((t) => t.name === teamName);
      if (!team) return;

      const teamMembers = team.members;
      const { repoStatusMap, foundAny: teamFound } = groupPRsByRepoAndStatus(
        pullRequests as Record<Status, TPullRequest[]>,
        selectedRepositories,
        teamMembers,
      );
      map[teamName] = repoStatusMap;
      if (teamFound) foundAny = true;
    });

    return { map, foundAny };
  }, [pullRequests, selectedRepositories, selectedTeams]);

  return (
    <LayoutContainer mt={{ initial: '2', sm: '5' }}>
      <Flex direction="column" gap="4" flexGrow="1">
        <Flex direction={{ initial: 'column', sm: 'row' }} justify="between" align="center">
          <Heading as="h1" size={{ initial: '4', sm: '6' }}>
            <span className="mr-2" role="img" aria-label="report">
              📋
            </span>
            Weekly report
          </Heading>
          <Text size={{ initial: '2', sm: '4' }} color="gray">
            Week from {format(startDate, 'MMMM d, yyyy', { locale: enUS })} to {format(endDate, 'MMMM d, yyyy', { locale: enUS })}
          </Text>
        </Flex>
        <Flex gap="2" justify="between" align="center">
          <Button variant="ghost" onClick={handlePreviousWeek}>
            <ArrowLeftIcon />
            <Text className="hidden sm:block">Previous Week</Text>
          </Button>
          <Flex gap="2">
            <TeamSelector
              teams={TEAMS}
              selectedTeams={selectedTeams}
              onSelectedTeamsChange={setSelectedTeams}
              mb="3"
            />
            <RepositoriesSelector
              repositories={repositories}
              selectedRepositories={selectedRepositories}
              onSelectedRepositoriesChange={setSelectedRepositories}
              mb="3"
            />
          </Flex>
          <Button
            variant="ghost"
            onClick={handleNextWeek}
            disabled={isAfter(
              endOfWeek(addWeeks(endDate, 1), { weekStartsOn: 0 }),
              endOfWeek(new Date(), { weekStartsOn: 0 }),
            )}
          >
            <Text className="hidden sm:block">Next Week</Text>
            <ArrowRightIcon />
          </Button>
        </Flex>
      </Flex>
      <Separator size="4" />
      <Box position="relative">
        <ScrollArea type="auto" scrollbars="vertical" style={{ height: '80svh' }}>
          <Box pr="4">
            {(() => {
              if (!pullRequests || isPending)
                return (
                  <Flex justify="center" align="center" height="80svh" width="100%">
                    <Loader />
                  </Flex>
                );

              if (!teamRepoStatusMap.foundAny) {
                return <Text color="gray">No pull requests found for these teams and repositories.</Text>;
              }
              return (
                <Box>
                  {selectedTeams.map((teamName) => {
                    const repoStatusMap = teamRepoStatusMap.map[teamName];
                    if (!repoStatusMap || Object.keys(repoStatusMap).length === 0) return null;
                    // Sort repos: gnolang/* first (original order), then others alphabetically
                    const gnolangRepos: [string, any][] = [];
                    const otherRepos: [string, any][] = [];
                    Object.entries(repoStatusMap).forEach(([repo, statusMap]) => {
                      if (repo.startsWith('gnolang/')) {
                        gnolangRepos.push([repo, statusMap]);
                      } else {
                        otherRepos.push([repo, statusMap]);
                      }
                    });
                    otherRepos.sort(([a], [b]) => a.localeCompare(b));
                    const sortedRepos = [...gnolangRepos, ...otherRepos];
                    return (
                      <Box key={teamName} mb="8" p="1">
                        <Heading
                          as="h2"
                          size="5"
                          className="sticky -top-[5px] z-30 py-1"
                          style={{ backgroundColor: 'white' }}
                        >
                          <Flex align="center" gap="2">
                            <PersonIcon />
                            {teamName}
                          </Flex>
                        </Heading>
                        {sortedRepos.map(([repo, statusMap]) => (
                          <RepoPRStatusList key={repo} repo={repo} statusMap={statusMap} isOffline={isOffline} />
                        ))}
                      </Box>
                    );
                  })}
                </Box>
              );
            })()}
          </Box>
        </ScrollArea>
      </Box>
    </LayoutContainer>
  );
};

export default ReportClientPage;
