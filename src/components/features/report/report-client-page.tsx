'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  PersonIcon,
} from '@radix-ui/react-icons';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  ScrollArea,
  Tabs,
} from '@radix-ui/themes';
import {
  endOfWeek,
  startOfWeek,
  subWeeks,
  addWeeks,
  isAfter,
  getWeek,
  setWeek,
  format,
  endOfMonth,
  startOfMonth,
  subMonths,
  addMonths,
  endOfYear,
  startOfYear,
  subYears,
  addYears,
} from 'date-fns';
import { enUS } from 'date-fns/locale';

import RepositoriesSelector from '@/modules/repositories-selector';
import Loader from '@/elements/loader';
import { useOffline } from '@/contexts/offline-context';
import useGetPullRequestsReport from '@/hooks/use-get-pullrequests-report';
import useGetRepositories from '@/hooks/use-get-repositories';
import { TPullRequest } from '@/utils/schemas';
import TEAMS from '@/constants/teams';
import TeamSelector from '@/modules/team-selector';
import RepoPRStatusList from './repo-pr-status-list';
import { TimeFilter } from '@/utils/github';

const TIMEFILTER_MAP = {
  [TimeFilter.ALL_TIME]: 'All time',
  [TimeFilter.YEARLY]: 'Yearly',
  [TimeFilter.MONTHLY]: 'Monthly',
  [TimeFilter.WEEKLY]: 'Weekly',
};

export const STATUS_ORDER = [
  'waiting_for_review',
  'in_progress',
  'reviewed',
  'merged',
  'blocked',
] as const;
export type Status = (typeof STATUS_ORDER)[number];

type RepoStatusMap = {
  [repo: string]: {
    [status in Status]?: TPullRequest[];
  };
};

type RepoStatusArray = [
  repo: string,
  statusMap: {
    [status in Status]?: TPullRequest[];
  }
];

type TeamRepoStatusMap = {
  map: Record<string, RepoStatusMap>;
  foundAny: boolean;
};

const statusToEmoji = {
  waiting_for_review: '🕒',
  in_progress: '🚧',
  reviewed: '✅',
  merged: '🔀',
  blocked: '⛔',
};

const reviewDecisionToEmoji = {
  APPROVED: '🟢',
  CHANGES_REQUESTED: '🟠',
  REVIEW_REQUIRED: '🔵',
  '': '',
};

const generateMarkdownReport = (
  startDate: Date,
  endDate: Date,
  selectedTeams: string[],
  teamRepoStatusMap: TeamRepoStatusMap,
) => {
  let md = '# Weekly PR Report\n';
  md += `**Week:** ${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}\n\n`;
  md += '**Legend:**\n';
  md += '- 🟢 Approved\n';
  md += '- 🟠 Changes Requested\n';
  md += '- 🔵 Review Required\n\n';

  selectedTeams.forEach((teamName) => {
    const repoStatusMap = teamRepoStatusMap.map[teamName];
    if (!repoStatusMap || Object.keys(repoStatusMap).length === 0) {
      md += `No pull requests found for team **${teamName}**.\n\n`;
      return;
    }

    md += `## 👥 ${teamName}\n`;

    const gnolangRepos: RepoStatusArray[] = [];
    const otherRepos: RepoStatusArray[] = [];

    Object.entries(repoStatusMap).forEach(([repo, statusMap]) => {
      if (repo.startsWith('gnolang/')) gnolangRepos.push([repo, statusMap]);
      else otherRepos.push([repo, statusMap]);
    });
    otherRepos.sort(([a], [b]) => a.localeCompare(b));

    const sortedRepos = [...gnolangRepos, ...otherRepos];

    sortedRepos.forEach(([repo, statusMap]) => {
      md += `\n\n### ${repo}\n\n`;
      STATUS_ORDER.forEach((status) => {
        const prs = statusMap[status] || [];
        if (prs.length === 0) return;
        md += `\n  - #### ${statusToEmoji[status] || ''} ${status.replace(/_/g, ' ').toUpperCase()}\n`;
        prs.forEach((pr) => {
          md += `    - **${pr.title}**  `;
          md += `([#${pr.number}](${pr.url})) by @${pr.authorLogin}`;
          if (pr.reviewDecision) {
            md += ` ${reviewDecisionToEmoji[pr.reviewDecision as keyof typeof reviewDecisionToEmoji] || ''
              }`;
          }
          md += '\n \n';
        });
      });
    });
  });

  return md;
};

function groupPRsByRepoAndStatus(
  pullRequests: Record<Status, TPullRequest[]>,
  selectedRepositories: string[],
  teamMembers: string[],
): { repoStatusMap: RepoStatusMap; foundAny: boolean } {
  const repoStatusMap: RepoStatusMap = {};
  let foundAny = false;

  STATUS_ORDER.forEach((status) => {
    const prs = pullRequests?.[status] || [];
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

  const [timeFilter, setTimeFilter] = useState<TimeFilter>(TimeFilter.WEEKLY);
  const [startDate, setStartDate] = useState(startOfWeek(initialRefDate, { weekStartsOn: 0 }));
  const [endDate, setEndDate] = useState(endOfWeek(initialRefDate, { weekStartsOn: 0 }));
  const [selectedTeams, setSelectedTeams] = useState<string[]>(['Core Team']);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(['gnolang/gno']);
  const [copied, setCopied] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const { data: repositories = [] } = useGetRepositories();
  const { data: pullRequests, isPending } = useGetPullRequestsReport({ startDate, endDate });

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
      const currentWeek = getWeek(endDate, { weekStartsOn: 0, firstWeekContainsDate: 1 });
      const params = new URLSearchParams(searchParams.toString());
      params.set('week', String(currentWeek));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    switch (timeFilter) {
      case TimeFilter.ALL_TIME:
        setStartDate(new Date(1980, 0, 1));
        setEndDate(new Date());
        break;
      case TimeFilter.YEARLY:
        setStartDate(startOfYear(now));
        setEndDate(endOfYear(now));
        break;
      case TimeFilter.MONTHLY:
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case TimeFilter.WEEKLY:
      default:
        setStartDate(startOfWeek(now, { weekStartsOn: 0 }));
        setEndDate(endOfWeek(now, { weekStartsOn: 0 }));
        break;
    }
  }, [timeFilter]);

  const pushWeekToUrl = (date: Date) => {
    const week = getWeek(date, { weekStartsOn: 0, firstWeekContainsDate: 1 });
    const params = new URLSearchParams(searchParams.toString());
    params.set('week', String(week));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePreviousPeriod = () => {
    if (timeFilter === TimeFilter.WEEKLY) {
      const targetEnd = endOfWeek(subWeeks(endDate, 1), { weekStartsOn: 0 });
      setStartDate(startOfWeek(targetEnd, { weekStartsOn: 0 }));
      setEndDate(targetEnd);
      pushWeekToUrl(targetEnd);
    } else if (timeFilter === TimeFilter.MONTHLY) {
      setStartDate(startOfMonth(subMonths(startDate, 1)));
      setEndDate(endOfMonth(subMonths(endDate, 1)));
    } else if (timeFilter === TimeFilter.YEARLY) {
      setStartDate(startOfYear(subYears(startDate, 1)));
      setEndDate(endOfYear(subYears(endDate, 1)));
    }
  };

  const handleNextPeriod = () => {
    if (timeFilter === TimeFilter.WEEKLY) {
      const targetEnd = endOfWeek(addWeeks(endDate, 1), { weekStartsOn: 0 });
      if (!isAfter(targetEnd, endOfWeek(new Date(), { weekStartsOn: 0 }))) {
        setStartDate(startOfWeek(targetEnd, { weekStartsOn: 0 }));
        setEndDate(targetEnd);
        pushWeekToUrl(targetEnd);
      }
    } else if (timeFilter === TimeFilter.MONTHLY) {
      const nextEnd = endOfMonth(addMonths(endDate, 1));
      if (!isAfter(nextEnd, new Date())) {
        setStartDate(startOfMonth(addMonths(startDate, 1)));
        setEndDate(nextEnd);
      }
    } else if (timeFilter === TimeFilter.YEARLY) {
      const nextEnd = endOfYear(addYears(endDate, 1));
      if (!isAfter(nextEnd, new Date())) {
        setStartDate(startOfYear(addYears(startDate, 1)));
        setEndDate(nextEnd);
      }
    }
  };

  const teamRepoStatusMap: TeamRepoStatusMap = useMemo(() => {
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

  useEffect(() => {
    if (pullRequests && teamRepoStatusMap) {
      const timeout = setTimeout(() => setIsFiltering(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [pullRequests, teamRepoStatusMap]);

  const handleCopyMarkdown = async () => {
    const md = generateMarkdownReport(startDate, endDate, selectedTeams, teamRepoStatusMap);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  // wrappers to enable filtering loader
  const handleTeamsChange = (teams: string[]) => {
    setIsFiltering(true);
    setTimeout(() => setSelectedTeams(teams), 0);
  };

  const handleRepositoriesChange = (repos: string[]) => {
    setIsFiltering(true);
    setTimeout(() => setSelectedRepositories(repos), 0);
  };

  return (
    <Box>
      <Flex direction="column" gap="4">
        <Flex direction={{ initial: 'column', sm: 'row' }} justify="between" align="center">
          <Heading as="h1" size={{ initial: '4', sm: '6' }}>
            📋 Report
          </Heading>
          <Text size={{ initial: '2', sm: '4' }} color="gray">
            From {timeFilter === TimeFilter.ALL_TIME ? 'Big Bang' : format(startDate, 'MMMM d, yyyy', { locale: enUS })} to {format(endDate, 'MMMM d, yyyy', { locale: enUS })}
          </Text>
        </Flex>

        <Flex gap="2" justify="between" align="center">
          <Box width="64px">
            {timeFilter !== TimeFilter.ALL_TIME && (
              <Button variant="ghost" onClick={handlePreviousPeriod}>
                <ArrowLeftIcon />
                <Text className="hidden sm:block">Previous</Text>
              </Button>
            )}
          </Box>

          <Flex direction={{ initial: 'column', sm: 'row' }} gap={{ initial: '1', sm: '2' }}>
            <TeamSelector
              teams={TEAMS}
              selectedTeams={selectedTeams}
              onSelectedTeamsChange={handleTeamsChange}
            />
            <RepositoriesSelector
              repositories={repositories}
              selectedRepositories={selectedRepositories}
              onSelectedRepositoriesChange={handleRepositoriesChange}
            />
            <Button onClick={handleCopyMarkdown} variant="soft">
              {copied ? <CheckIcon /> : <CopyIcon />}
              Copy as markdown
            </Button>
          </Flex>

          <Box width="64px">
            {timeFilter !== TimeFilter.ALL_TIME && (
              <Button
                variant="ghost"
                onClick={handleNextPeriod}
                disabled={isAfter(endDate, new Date())}
              >
                <Text className="hidden sm:block">Next</Text>
                <ArrowRightIcon />
              </Button>
            )}
          </Box>
        </Flex>

        <Tabs.Root value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)} mb="4">
          <Tabs.List justify="center">
            {Object.values(TimeFilter).map((value) => (
              <Tabs.Trigger value={value} key={value}>
                {TIMEFILTER_MAP[value]}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>
      </Flex>

      <Box position="relative">
        <ScrollArea type="auto" scrollbars="vertical" style={{ height: '80svh' }}>
          <Box pr="4">
            {(() => {
              if (isPending || isFiltering)
                return (
                  <Flex justify="center" align="center" height="80svh">
                    <Loader />
                  </Flex>
                );

              if (!teamRepoStatusMap.foundAny)
                return <Text color="gray">No pull requests found for these filters.</Text>;

              return (
                <Box>
                  {selectedTeams.map((teamName) => {
                    const repoStatusMap = teamRepoStatusMap.map[teamName];
                    if (!repoStatusMap || Object.keys(repoStatusMap).length === 0) return null;

                    const gnolangRepos: [string, any][] = [];
                    const otherRepos: [string, any][] = [];
                    Object.entries(repoStatusMap).forEach(([repo, statusMap]) => {
                      if (repo.startsWith('gnolang/')) gnolangRepos.push([repo, statusMap]);
                      else otherRepos.push([repo, statusMap]);
                    });
                    otherRepos.sort(([a], [b]) => a.localeCompare(b));
                    const sortedRepos = [...gnolangRepos, ...otherRepos];

                    return (
                      <Box key={teamName} mb="8" p="1">
                        <Heading
                          as="h2"
                          size="5"
                          className="sticky -top-[5px] z-30 py-1"
                          style={{ backgroundColor: 'var(--color-background)' }}
                        >
                          <Flex align="center" gap="2">
                            <PersonIcon />
                            {teamName}
                          </Flex>
                        </Heading>
                        {sortedRepos.map(([repo, statusMap]) => (
                          <RepoPRStatusList
                            key={repo}
                            repo={repo}
                            statusMap={statusMap}
                            isOffline={isOffline}
                          />
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
    </Box>
  );
};

export default ReportClientPage;
