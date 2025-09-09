'use client';

import { useState, useMemo, useEffect } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import RepoPRStatusList from './repo-pr-status-list';
import { endOfWeek, subWeeks, addWeeks, format, isAfter, getWeek, setWeek, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, User } from 'lucide-react';
import TeamSelector from '@/modules/team-selector';

import Loader from '@/elements/loader';

import { useOffline } from '@/contexts/offline-context';

import useGetPullRequestsReport from '@/hooks/use-get-pullrequests-report';
import useSelectedRepositories from '@/hooks/use-selected-repositories';

import { TPullRequest } from '@/utils/schemas';

import TEAMS from '@/constants/teams';

import LayoutContainer from '@/components/layouts/layout-container';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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
      // When no repositories are selected, treat as "all repositories"
      // and derive the repo name from the PR URL (owner/name).
      let repo: string | undefined;
      if (selectedRepositories.length === 0) {
        const match = pr.url.match(/github\.com\/([^/]+\/[^/]+)/i);
        repo = match?.[1];
      } else {
        repo = selectedRepositories.find((r) => pr.url.includes(r));
      }
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
  const selectedRepositories = useSelectedRepositories();
  const { data: pullRequests, isPending } = useGetPullRequestsReport({ startDate, endDate });

  // Sync week with URL: initialize from ?week= and update URL when week changes via navigation buttons
  useEffect(() => {
    const weekParam = Number(searchParams.get('week'));
    if (!Number.isNaN(weekParam) && weekParam >= 1 && weekParam <= 53) {
      const targetEnd = endOfWeek(setWeek(new Date(), weekParam, { weekStartsOn: 0, firstWeekContainsDate: 1 }), {
        weekStartsOn: 0,
      });
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
    <LayoutContainer className="mt-5">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col items-center justify-between sm:flex-row">
          <h1 className="text-2xl font-bold sm:text-3xl">
            <span className="mr-2" role="img" aria-label="report">
              📋
            </span>
            Weekly report
          </h1>
          <span className="text-muted-foreground text-sm sm:text-base">
            Week from {format(startDate, 'MMMM d, yyyy', { locale: enUS })} to{' '}
            {format(endDate, 'MMMM d, yyyy', { locale: enUS })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={handlePreviousWeek}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:block">Previous Week</span>
          </Button>
          <div className="flex gap-2">
            <TeamSelector
              teams={TEAMS}
              selectedTeams={selectedTeams}
              onSelectedTeamsChange={setSelectedTeams}
              className="mb-3"
            />
          </div>
          <Button
            variant="ghost"
            onClick={handleNextWeek}
            disabled={isAfter(
              endOfWeek(addWeeks(endDate, 1), { weekStartsOn: 0 }),
              endOfWeek(new Date(), { weekStartsOn: 0 }),
            )}
          >
            <span className="hidden sm:block">Next Week</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Separator className="my-2" />
      <div className="relative">
        <ScrollArea className="h-[80svh]">
          <div className="pr-4">
            {(() => {
              if (!pullRequests || isPending)
                return (
                  <div className="flex h-[80svh] w-full items-center justify-center">
                    <Loader />
                  </div>
                );

              if (!teamRepoStatusMap.foundAny) {
                return (
                  <span className="text-muted-foreground text-sm">
                    No pull requests found for these teams and repositories.
                  </span>
                );
              }
              return (
                <div>
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
                      <div key={teamName} className="mb-8 p-1">
                        <h2
                          className="sticky -top-[5px] z-30 flex items-center gap-2 py-1 text-xl font-semibold"
                          style={{ backgroundColor: 'var(--color-background)' }}
                        >
                          <User className="h-4 w-4" />
                          {teamName}
                        </h2>
                        {sortedRepos.map(([repo, statusMap]) => (
                          <RepoPRStatusList key={repo} repo={repo} statusMap={statusMap} isOffline={isOffline} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </ScrollArea>
      </div>
    </LayoutContainer>
  );
};

export default ReportClientPage;
