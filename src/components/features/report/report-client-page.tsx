'use client';

import { useState, useMemo, useEffect } from 'react';

import Image from 'next/image';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
  MixerHorizontalIcon,
  PersonIcon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  ScrollArea,
  Tooltip,
  IconButton,
  Popover,
  CheckboxGroup,
  Separator,
  Checkbox,
  Avatar,
  Link,
  HoverCard,
} from '@radix-ui/themes';
import { endOfWeek, subWeeks, addWeeks, format, isAfter } from 'date-fns';

import RepositoriesSelector from '@/modules/repositories-selector';

import Loader from '@/elements/loader';

import { useOffline } from '@/contexts/offline-context';

import useGetPullRequestsReport from '@/hooks/use-get-pullrequests-report';
import useGetRepositories from '@/hooks/use-get-repositories';

import { TPullRequest } from '@/utils/schemas';

import TEAMS from '@/constants/teams';

import MinecraftHeart from '@/images/minecraft-heart.png';

import LayoutContainer from '@/components/layouts/layout-container';

type RepoStatusMap = {
  [repo: string]: {
    [status: string]: TPullRequest[];
  };
};

type Status = 'blocked' | 'in_progress' | 'merged' | 'reviewed' | 'waiting_for_review';

const STATUS_TOOLTIPS: Record<Status, string> = {
  blocked: 'PRs is technically mergeable but blocked.',
  in_progress: 'PRs is open but hasn’t been approved or is not ready to be merged yet.',
  merged: 'PRs has been merged into the target branch.',
  reviewed: 'PRs has been approved but hasn’t been merged yet.',
  waiting_for_review: 'PRs is open and still requires a review.',
};

const STATUS_ORDER: Status[] = ['waiting_for_review', 'in_progress', 'reviewed', 'merged', 'blocked'];

const REVIEW_DECISION_ICON_MAP = {
  APPROVED: <CheckCircledIcon color="green" />,
  CHANGES_REQUESTED: <ExclamationTriangleIcon color="orange" />,
  REVIEW_REQUIRED: <QuestionMarkCircledIcon color="blue" />,
  '': <></>,
};

function groupPRsByRepoAndStatus(
  pullRequests: Record<Status, TPullRequest[]>,
  selectedRepositories: string[],
  teamMembers: string[],
): { repoStatusMap: RepoStatusMap; foundAny: boolean } {
  const repoStatusMap: RepoStatusMap = {};
  let foundAny = false;
  STATUS_ORDER.forEach((status) => {
    const prs = (pullRequests || {})[status] || [];
    prs.forEach((pr: any) => {
      const repo = selectedRepositories.find((r) => pr.url.includes(r));
      if (!repo) return;
      if (!teamMembers.includes(pr.author?.login)) return;
      if (!repoStatusMap[repo]) repoStatusMap[repo] = {};
      if (!repoStatusMap[repo][status]) repoStatusMap[repo][status] = [];
      repoStatusMap[repo][status].push(pr);
      foundAny = true;
    });
  });
  return { repoStatusMap, foundAny };
}

interface RepoPRStatusListProps {
  repo: string;
  statusMap: { [status: string]: TPullRequest[] };
  isOffline: boolean;
}

function RepoPRStatusList({ repo, statusMap, isOffline }: RepoPRStatusListProps) {
  return (
    <Box key={repo} mb="5" pl={{ initial: '0', sm: '4' }}>
      <Heading as="h3" size="4" style={{ backgroundColor: 'white' }} className="sticky top-[25px] z-20 py-1">
        <Flex align="center" gap="2">
          <MixerHorizontalIcon />
          {repo}
        </Flex>
      </Heading>
      <Flex direction="column" gap="4">
        {STATUS_ORDER.map((status) =>
          statusMap[status] && statusMap[status].length > 0 ? (
            <Box key={status} pl={{ initial: '0', sm: '2' }}>
              <Box
                width="100%"
                style={{ backgroundColor: 'white' }}
                className="sticky top-[55px] z-10 py-1 text-center"
              >
                <Tooltip content={STATUS_TOOLTIPS[status]}>
                  <Heading as="h4" size="2" weight="bold" color="gray" className="inline-block cursor-help">
                    {status.replace(/_/g, ' ').toUpperCase()}
                  </Heading>
                </Tooltip>
              </Box>
              <ul className="sm:pl-4">
                {[...statusMap[status]]
                  .sort((a, b) => {
                    const aLogin = a.author?.login || '';
                    const bLogin = b.author?.login || '';
                    return aLogin.localeCompare(bLogin);
                  })
                  .map((pr: TPullRequest) => (
                    <li key={pr.id} className="hover:bg-gray-2">
                      <Flex gap="2" align="center" py="1" className="overflow-hidden">
                        <Avatar
                          size="1"
                          radius="full"
                          src={pr.author?.avatarUrl}
                          fallback={pr.author?.avatarUrl ? pr.author?.login[0] : '?'}
                        />
                        <Link href={isOffline ? '' : `/@${pr.author?.login}`}>
                          <Tooltip content={pr.author?.login}>
                            <Text
                              weight="bold"
                              size="2"
                              className="sm:max-w-auto inline-block min-w-0 max-w-[70px] overflow-hidden text-ellipsis whitespace-nowrap xs:max-w-[90px]"
                            >
                              {pr.author?.login}
                            </Text>
                          </Tooltip>
                        </Link>
                        <Link href={isOffline ? '' : pr.url} target="_blank" rel="noopener noreferrer">
                          <Tooltip content={pr.title}>
                            <Text
                              size="2"
                              className="sm:max-w-auto inline-block min-w-0 max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap xs:max-w-[280px]"
                            >
                              {pr.title}
                            </Text>
                          </Tooltip>
                        </Link>
                        <Flex ml="auto" align="center" gap="4">
                          {(pr.reviews?.length ?? 0) > 10 && (
                            <Tooltip content={`Loved PR, Reviewed more than ${pr.reviews?.length ?? 0} times`}>
                              <Text size="2">
                                <Image src={MinecraftHeart} alt="minecraft heart " width={12} height={12} />
                              </Text>
                            </Tooltip>
                          )}
                          <Tooltip content={pr.reviewDecision || 'No review decision'}>
                            <Text>
                              {
                                REVIEW_DECISION_ICON_MAP[
                                  (pr.reviewDecision &&
                                  ['APPROVED', 'CHANGES_REQUESTED', 'REVIEW_REQUIRED'].includes(pr.reviewDecision)
                                    ? pr.reviewDecision
                                    : '') as 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | ''
                                ]
                              }
                            </Text>
                          </Tooltip>
                          <HoverCard.Root>
                            <HoverCard.Trigger>
                              <IconButton variant="soft">
                                <InfoCircledIcon />
                              </IconButton>
                            </HoverCard.Trigger>
                            <HoverCard.Content width="360px">
                              <Flex direction="column" gap="2" p="2">
                                <Text size="2" weight="bold">
                                  {pr.title}
                                </Text>
                                <Text size="1" weight="bold" color="gray">
                                  PR #{pr.number} • {pr.state}
                                </Text>
                                <Text size="1" color="gray">
                                  <Text weight="bold">Author: </Text> {pr.author?.login}
                                </Text>
                                <Text size="1" color="gray">
                                  <Text weight="bold">Review Decision: </Text> {pr.reviewDecision || 'N/A'}
                                </Text>
                                <Text size="1" color="gray">
                                  <Text weight="bold">Created: </Text>{' '}
                                  {pr.createdAt ? new Date(pr.createdAt).toLocaleString() : 'N/A'}
                                </Text>
                                <Text size="1" color="gray">
                                  <Text weight="bold">Updated: </Text>{' '}
                                  {pr.updatedAt ? new Date(pr.updatedAt).toLocaleString() : 'N/A'}
                                </Text>
                                <Text size="1" color="gray">
                                  <Text weight="bold">URL: </Text>{' '}
                                  <Link href={pr.url} target="_blank" rel="noopener noreferrer">
                                    {pr.url}
                                  </Link>
                                </Text>
                                <Text size="1" color="gray">
                                  <Text weight="bold">Reviewed: </Text> {pr.reviews?.length} times
                                </Text>
                              </Flex>
                            </HoverCard.Content>
                          </HoverCard.Root>
                        </Flex>
                      </Flex>
                      <Separator size="4" />
                    </li>
                  ))}
              </ul>
            </Box>
          ) : null,
        )}
      </Flex>
    </Box>
  );
}

const TeamSelector = ({
  teams,
  selectedTeams,
  onSelectedTeamsChange,
  defaultCheckedNames = ['Core Team'],
  ...props
}: {
  teams: { name: string }[];
  selectedTeams: string[];
  onSelectedTeamsChange: (selected: string[]) => void;
  defaultCheckedNames?: string[];
} & React.ComponentProps<typeof Button>) => {
  const handleSelectAllToggle = () => {
    if (selectedTeams.length === teams.length) {
      onSelectedTeamsChange(defaultCheckedNames);
    } else {
      onSelectedTeamsChange(teams.map((team) => team.name));
    }
  };

  useEffect(() => {
    if (selectedTeams.length === 0) {
      onSelectedTeamsChange(defaultCheckedNames);
    }
  }, [selectedTeams.length, defaultCheckedNames]);

  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button variant="soft" {...(props as React.ComponentProps<typeof Button>)}>
          <PersonIcon /> Teams
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <Text as="label" size="2">
          <Flex as="span" gap="2">
            <Checkbox checked={selectedTeams.length === teams.length} onCheckedChange={handleSelectAllToggle} />{' '}
            Select/Unselect All
          </Flex>
        </Text>
        <Separator size="4" my="2" />
        <CheckboxGroup.Root
          value={selectedTeams}
          onValueChange={onSelectedTeamsChange}
          defaultValue={defaultCheckedNames}
        >
          {teams.map(({ name }) => (
            <CheckboxGroup.Item key={name} value={name}>
              {name}
            </CheckboxGroup.Item>
          ))}
        </CheckboxGroup.Root>
      </Popover.Content>
    </Popover.Root>
  );
};

const ReportClientPage = () => {
  const { isOffline } = useOffline();
  const [startDate, setStartDate] = useState<Date>(endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedTeams, setSelectedTeams] = useState<string[]>(['Core Team']);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([
    'gnolang/gno',
    'gnolang/gnopls',
    'onbloc/gnoscan',
    'gnolang/hackerspace',
    'gnolang/gnokey-mobile',
    'onbloc/adena-wallet',
    'onbloc/adena-wallet-sdk',
    'TERITORI/teritori-dapp',
    'samouraiworld/zenao',
    'samouraiworld/gnolove',
    'samouraiworld/gnomonitoring',
    'samouraiworld/peerdev',
  ]);

  const { data: repositories = [] } = useGetRepositories();
  const { data: pullRequests, isPending } = useGetPullRequestsReport({ startDate, endDate });

  const handlePreviousWeek = () => {
    const newStartDate = endOfWeek(subWeeks(startDate, 1), { weekStartsOn: 0 });
    const newEndDate = endOfWeek(subWeeks(endDate, 1), { weekStartsOn: 0 });
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleNextWeek = () => {
    const newStartDate = endOfWeek(addWeeks(startDate, 1), { weekStartsOn: 0 });
    const newEndDate = endOfWeek(addWeeks(endDate, 1), { weekStartsOn: 0 });
    if (!isAfter(newEndDate, endOfWeek(new Date(), { weekStartsOn: 0 }))) {
      setStartDate(newStartDate);
      setEndDate(newEndDate);
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
            <span role="img" aria-label="report">
              📋
            </span>
            Weekly report
          </Heading>
          <Text size={{ initial: '2', sm: '4' }} color="gray">
            Week from {format(startDate, 'dd/MM/yyyy')} to {format(endDate, 'dd/MM/yyyy')}
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
              defaultCheckedNames={['Core Team']}
              mb="3"
            />
            <RepositoriesSelector
              repositories={repositories}
              selectedRepositories={selectedRepositories}
              onSelectedRepositoriesChange={setSelectedRepositories}
              defaultCheckedIds={['gnolang/gno']}
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
