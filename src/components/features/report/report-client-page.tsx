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
  DotsVerticalIcon,
  DownloadIcon,
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
  DropdownMenu,
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
  getMonth,
  getYear,
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

const DEFAULT_REPOSITORIES = ['gnolang/gno'];
const DEFAULT_TEAMS = ['Core Team'];

export const TIMEFILTER_CONFIG = {
  [TimeFilter.ALL_TIME]: {
    label: 'All time',
    getRange: () => ({
      start: new Date(1980, 0, 1),
      end: new Date(),
    }),
  },
  [TimeFilter.YEARLY]: {
    label: 'Yearly',
    getRange: (year = new Date().getFullYear()) => ({
      start: startOfYear(new Date(year, 0, 1)),
      end: endOfYear(new Date(year, 0, 1)),
      year,
    }),
  },
  [TimeFilter.MONTHLY]: {
    label: 'Monthly',
    getRange: (month = new Date().getMonth()) => ({
      start: startOfMonth(new Date(new Date().getFullYear(), month, 1)),
      end: endOfMonth(new Date(new Date().getFullYear(), month, 1)),
      month,
    }),
  },
  [TimeFilter.WEEKLY]: {
    label: 'Weekly',
    getRange: (week = getWeek(new Date())) => {
      const ref = setWeek(new Date(), week, { weekStartsOn: 0 });
      return {
        start: startOfWeek(ref, { weekStartsOn: 0 }),
        end: endOfWeek(ref, { weekStartsOn: 0 }),
        week,
      };
    },
  },
} as const;

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
      return md;
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

  const [copied, setCopied] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const { data: repositories = [] } = useGetRepositories();

  const initialParams = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const filter = (params.get('filter') as TimeFilter) || TimeFilter.WEEKLY;
    const year = Number(params.get('year')) || new Date().getFullYear();
    const month = Number(params.get('month')) || new Date().getMonth();
    const week = Number(params.get('week')) || getWeek(new Date());
    const repos = params.getAll('repos').length ? params.getAll('repos') : DEFAULT_REPOSITORIES;
    const teams = params.getAll('teams').length ? params.getAll('teams') : DEFAULT_TEAMS;

    let start: Date, end: Date;
    switch (filter) {
      case TimeFilter.YEARLY:
        start = startOfYear(new Date(year, 0, 1));
        end = endOfYear(new Date(year, 0, 1));
        break;
      case TimeFilter.MONTHLY:
        start = startOfMonth(new Date(year, month, 1));
        end = endOfMonth(new Date(year, month, 1));
        break;
      case TimeFilter.WEEKLY:
        const ref = setWeek(new Date(year, 0, 1), week, { weekStartsOn: 0 });
        start = startOfWeek(ref, { weekStartsOn: 0 });
        end = endOfWeek(ref, { weekStartsOn: 0 });
        break;
      case TimeFilter.ALL_TIME:
      default:
        start = new Date(1980, 0, 1);
        end = new Date();
    }

    return { filter, year, month, week, start, end, repos, teams };
  }, [searchParams]);

  const [timeFilter, setTimeFilter] = useState(initialParams.filter);
  const [startDate, setStartDate] = useState(initialParams.start);
  const [endDate, setEndDate] = useState(initialParams.end);
  const [year, setYear] = useState(initialParams.year);
  const [month, setMonth] = useState(initialParams.month);
  const [week, setWeekNum] = useState(initialParams.week);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(initialParams.teams);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(initialParams.repos);
  const { data: pullRequests, isPending } = useGetPullRequestsReport({ startDate, endDate });

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('filter', timeFilter);

    if (timeFilter === TimeFilter.YEARLY) {
      params.set('year', String(year));
    } else if (timeFilter === TimeFilter.MONTHLY) {
      params.set('month', String(month));
    } else if (timeFilter === TimeFilter.WEEKLY) {
      params.set('week', String(week));
    }

    selectedRepositories.forEach((repo) => params.append('repos', repo));
    selectedTeams.forEach((team) => params.append('teams', team));

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [timeFilter, year, month, week, selectedTeams, selectedRepositories]);

  const handleNextPeriod = () => {
    if (timeFilter === TimeFilter.WEEKLY) {
      const next = addWeeks(startDate, 1);
      setStartDate(startOfWeek(next));
      setEndDate(endOfWeek(next));
      setWeekNum(getWeek(next));
      setYear(getYear(next));
    } else if (timeFilter === TimeFilter.MONTHLY) {
      const next = addMonths(startDate, 1);
      setStartDate(startOfMonth(next));
      setEndDate(endOfMonth(next));
      setMonth(getMonth(next));
      setYear(getYear(next));
    } else if (timeFilter === TimeFilter.YEARLY) {
      const next = addYears(startDate, 1);
      setStartDate(startOfYear(next));
      setEndDate(endOfYear(next));
      setYear(getYear(next));
    }
  };

  const handlePreviousPeriod = () => {
    if (timeFilter === TimeFilter.WEEKLY) {
      const prev = subWeeks(startDate, 1);
      setStartDate(startOfWeek(prev));
      setEndDate(endOfWeek(prev));
      setWeekNum(getWeek(prev));
      setYear(getYear(prev));
    } else if (timeFilter === TimeFilter.MONTHLY) {
      const prev = subMonths(startDate, 1);
      setStartDate(startOfMonth(prev));
      setEndDate(endOfMonth(prev));
      setMonth(getMonth(prev));
      setYear(getYear(prev));
    } else if (timeFilter === TimeFilter.YEARLY) {
      const prev = subYears(startDate, 1);
      setStartDate(startOfYear(prev));
      setEndDate(endOfYear(prev));
      setYear(getYear(prev));
    }
  }

  useEffect(() => {
    let start: Date, end: Date;

    switch (timeFilter) {
      case TimeFilter.ALL_TIME:
        ({ start, end } = TIMEFILTER_CONFIG[timeFilter].getRange());
        break;
      case TimeFilter.YEARLY:
        ({ start, end } = TIMEFILTER_CONFIG[timeFilter].getRange(year));
        break;
      case TimeFilter.MONTHLY:
        ({ start, end } = TIMEFILTER_CONFIG[timeFilter].getRange(month));
        break;
      case TimeFilter.WEEKLY:
        ({ start, end } = TIMEFILTER_CONFIG[timeFilter].getRange(week));
        break;
    }

    setStartDate(start);
    setEndDate(end);

  }, [timeFilter]);

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
    } catch (e) {
      console.error('Failed to copy markdown report to clipboard', e);
      setCopied(false);
    }
  };

  const handleDownloadMarkdown = async () => {
    const md = generateMarkdownReport(startDate, endDate, selectedTeams, teamRepoStatusMap);

    try {
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `pr-report-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.md`;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download markdown report', e);
    }
  };

  // wrappers to enable filtering loader
  const handleTeamsChange = (teams: string[]) => {
    setIsFiltering(true);
    setSelectedTeams(teams);
  };

  const handleRepositoriesChange = (repos: string[]) => {
    setIsFiltering(true);
    setSelectedRepositories(repos);
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
          <Flex width="64px">
            {timeFilter !== TimeFilter.ALL_TIME && (
              <Button variant="ghost" onClick={handlePreviousPeriod}>
                <ArrowLeftIcon />
                <Text className="hidden sm:block">Previous</Text>
              </Button>
            )}
          </Flex>

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

            <Flex className="hidden sm:flex" gap="2">
              <Button onClick={handleCopyMarkdown} variant="soft">
                {copied ? <CheckIcon /> : <CopyIcon />}
                Copy as markdown
              </Button>
              <Button onClick={handleDownloadMarkdown} variant="soft">
                <DownloadIcon /> Download as markdown
              </Button>
            </Flex>

            <Box className="sm:hidden">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button className="w-full" variant="soft">
                    <DotsVerticalIcon />
                    Actions
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item onClick={handleCopyMarkdown}>
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    Copy as markdown
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={handleDownloadMarkdown}>
                    <DownloadIcon />
                    Download as markdown
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Box>
          </Flex>

          <Flex width="64px" justify="end">
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
          </Flex>
        </Flex>

        <Tabs.Root value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)} mb="4">
          <Tabs.List justify="center">
            {Object.values(TimeFilter).map((value) => (
              <Tabs.Trigger key={value} value={value}>
                {TIMEFILTER_CONFIG[value].label}
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
