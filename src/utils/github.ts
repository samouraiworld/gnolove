import { graphql } from '@octokit/graphql/types';
import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { endOfMonth, endOfWeek, endOfYear, format, Interval, startOfMonth, startOfWeek, startOfYear } from 'date-fns';

import { Issue, PullRequest, Repository, User, UserWithStats } from '@/type/github';

export enum TimeFilter {
  ALL_TIME = 'All Time',
  YEARLY = 'Yearly',
  MONTHLY = 'Monthly',
  WEEKLY = 'Weekly',
}

/**
 * Get the contributors (mentionable users) from a specific repository
 * @param client The graphql client
 * @param repo The repository to get the contributors from
 */
export const getContributors = async (client: graphql, repo: Repository): Promise<User[]> => {
  let hasNextPage = true;
  let endCursor = null;

  const contributors: User[] = [];

  const query = `
    query($owner: String!, $repo: String!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        mentionableUsers(first: 100, after: $cursor) {
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            id
            login
            avatarUrl
            url
            name
          }
        }
      }
    }
  `;

  while (hasNextPage) {
    const res: {
      repository: {
        mentionableUsers: {
          nodes: { id: string; login: string; avatarUrl: string; url: string; name: string }[];
          pageInfo: { hasNextPage: boolean; endCursor: string };
        };
      };
    } = await client(query, { owner: repo.owner, repo: repo.repository, cursor: endCursor });

    contributors.push(...res.repository.mentionableUsers.nodes);

    hasNextPage = res.repository.mentionableUsers.pageInfo.hasNextPage;
    endCursor = res.repository.mentionableUsers.pageInfo.endCursor;
  }

  return contributors;
};

/**
 * Build a search query for a specific user in a repository (can be tested in the "Search all issues" bar in GitHub)
 * @param repo The repository
 * @param user The user
 * @param interval The interval
 * @param is The type of issues (issue, pr, merged)
 * @param reviewedBy If the user reviewed the PRs
 */
export const buildSearchQuery = (
  repo: Repository,
  user: User,
  interval: Interval | undefined,
  is: ('issue' | 'pr' | 'merged')[],
  reviewedBy?: boolean,
) => {
  const query = [`repo:${repo.owner}/${repo.repository}`, `author:${user.login}`, is.map((v) => `is:${v}`)];

  if (interval) {
    const stringyfiedInterval = [interval.start, interval.end].map((value) => format(value, 'yyyy-MM-dd')).join('..');
    query.push(`created:${stringyfiedInterval}`);
  }

  if (reviewedBy) {
    query.push(`reviewed-by:${user.login}`);
  }

  return query.join(' ');
};

/**
 * Get the stats of a specific user in a repository
 * @param client The graphql client
 * @param repo The repository
 * @param user The user
 * @param interval The interval
 */
export const getUserStats = async (
  client: graphql,
  repo: Repository,
  user: User,
  interval: Interval | undefined,
): Promise<UserWithStats> => {
  const query = `
    query($owner: String!, $repository: String!, $id: ID!, $until: GitTimestamp, $since: GitTimestamp,  $issuesQuery: String!, $pullRequestsQuery: String!, $mergedRequestsQuery: String!, $reviewedMergedRequestsQuery: String!) {
      commits: repository(owner: $owner, name: $repository) {
        defaultBranchRef {
          target {
            ... on Commit {
              history(author: {id: $id}, since: $since, until: $until) {
                totalCount
              }
            }
          }
        }
      }
      
      issues: search(query: $issuesQuery, type: ISSUE, last: 100) {
        nodes {
          ... on Issue {
            id
            title
            url
            createdAt
            updatedAt
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
          }
        }
        count: issueCount
      }

      pullRequests: search(query: $pullRequestsQuery, type: ISSUE, last: 100) {
        nodes {
          ... on PullRequest {
            id
            title
            url
            createdAt
            updatedAt
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
          }
        }
        count: issueCount
      }
      
      mergedRequests: search(query: $mergedRequestsQuery, type: ISSUE, last: 100) {
        nodes {
          ... on PullRequest {
            id
            title
            url
            createdAt
            updatedAt
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
          }
        }
        count: issueCount
      }
      
      reviewedMergedRequests: search(query: $reviewedMergedRequestsQuery, type: ISSUE, last: 100) {
        nodes {
          ... on PullRequest {
            id
            title
            url
            createdAt
            updatedAt
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
          }
        }
        count: issueCount
      }
    }`;

  const issuesQuery = buildSearchQuery(repo, user, interval, ['issue']);
  const pullRequestsQuery = buildSearchQuery(repo, user, interval, ['pr']);
  const mergedRequestsQuery = buildSearchQuery(repo, user, interval, ['merged']);
  const reviewedMergedRequestsQuery = buildSearchQuery(repo, user, interval, ['merged'], true);

  type ReturnedNode = {
    id: string;
    title: string;
    url: string;
    createdAt: string;
    updatedAt: string;
    labels: { nodes: { name: string; color: string }[] };
  };

  type ReturnedIssues = { nodes: ReturnedNode[]; count: number };
  type ReturnedPullRequests = { nodes: ReturnedNode[]; count: number };
  type ReturnedMergedRequests = { nodes: ReturnedNode[]; count: number };
  type ReturnedReviewedMergedRequests = { nodes: ReturnedNode[]; count: number };

  type ReturnedCommits = { defaultBranchRef: { target: { history: { totalCount: number } } } };

  const res = await client<{
    commits: ReturnedCommits;
    issues: ReturnedIssues;
    pullRequests: ReturnedPullRequests;
    mergedRequests: ReturnedMergedRequests;
    reviewedMergedRequests: ReturnedReviewedMergedRequests;
  }>(query, {
    owner: repo.owner,
    repository: repo.repository,
    id: user.id,
    since: interval?.start ?? null,
    until: interval?.end ?? null,
    issuesQuery,
    pullRequestsQuery,
    mergedRequestsQuery,
    reviewedMergedRequestsQuery,
  });

  const mapNodesAndLabels = (nodes: ReturnedNode[]) => {
    return nodes.map(({ labels, ...props }) => ({ ...props, labels: labels.nodes }));
  };

  // TODO: Use schema validation to prevent invalid data from being retrieved and type mismatch.

  return {
    ...user,
    commits: res.commits.defaultBranchRef.target.history.totalCount,
    issues: { count: res.issues.count, data: mapNodesAndLabels(res.issues.nodes) },
    prs: { count: res.pullRequests.count, data: mapNodesAndLabels(res.pullRequests.nodes) },
    mrs: { count: res.mergedRequests.count, data: mapNodesAndLabels(res.mergedRequests.nodes) },
    reviewedMrs: { count: res.reviewedMergedRequests.count, data: mapNodesAndLabels(res.reviewedMergedRequests.nodes) },
  };
};

export const getUsersWithStats = async (
  client: graphql,
  repo: Repository,
  timeFilter: TimeFilter,
): Promise<UserWithStats[]> => {
  const interval = getTimeFilterInterval(timeFilter);

  const users = await getContributors(client, repo);
  return Promise.all(users.map((user) => getUserStats(client, repo, user, interval)));
};

/**
 * Get the interval of a specific time filter
 * @param timeFilter The time filter
 */
export const getTimeFilterInterval = (timeFilter: TimeFilter | undefined): Interval | undefined => {
  const now = new Date();

  switch (timeFilter) {
    case TimeFilter.WEEKLY:
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };

    case TimeFilter.MONTHLY:
      return { start: startOfMonth(now), end: endOfMonth(now) };

    case TimeFilter.YEARLY:
      return { start: startOfYear(now), end: endOfYear(now) };

    default:
      return undefined;
  }
};

/**
 * Util function to check if the value is a TimeFilter
 * @param value The value to check
 */
export const isTimeFilter = (value: string): value is keyof typeof TimeFilter => {
  return value in TimeFilter;
};

/**
 * Get the time filter from a search parameter
 * @param searchParam The search parameter
 * @param fallback Default value in case the searchParam filter is invalid
 */
export const getTimeFilterFromSearchParam = (
  searchParam: string | string[] | undefined | null,
  fallback = TimeFilter.ALL_TIME,
) => {
  return searchParam && typeof searchParam === 'string' && isTimeFilter(searchParam)
    ? TimeFilter[searchParam]
    : fallback;
};

export const getTimeFilterFromAPISearchParam = (
  searchParam: string | string[] | undefined | null,
  fallback = TimeFilter.ALL_TIME,
) => {
  switch (searchParam) {
    case 'all_time':
      return TimeFilter.ALL_TIME;
    case 'yearly':
      return TimeFilter.YEARLY;
    case 'monthly':
      return TimeFilter.MONTHLY;
    case 'weekly':
      return TimeFilter.WEEKLY;
    default:
      return fallback;
  }
};

/**
 * Util function to compare the createdAt property of two objects
 * @param objA Object A
 * @param objB Object B
 */
export const cmpCreatedAt = <T extends { createdAt: string | Date } | { created_at: string | Date }>(
  objA: T,
  objB: T,
): number => {
  return (
    new Date('createdAt' in objB ? objB.createdAt : objB.created_at).getTime() -
    new Date('createdAt' in objA ? objA.createdAt : objA.created_at).getTime()
  );
};

/**
 * Util function to compare the updatedAt property of two objects
 * @param objA Object A
 * @param objB Object B
 */
export const cmpUpdatedAt = <T extends { createdAt: string | Date }>(objA: T, objB: T): number => {
  return new Date(objB.createdAt).getTime() - new Date(objA.createdAt).getTime();
};

/**
 * Get the last MRs from a list of contributors
 * @param contributors The contributors
 * @param last The number of MRs to get
 */
export const getLastMRs = (contributors: UserWithStats[], last: number) => {
  const mrs = contributors.map(({ mrs }) => mrs.data).flat();
  return mrs.toSorted(cmpUpdatedAt).slice(0, last);
};

/**
 * Get the last issues with a specific label from a list of contributors
 * @param contributors The contributors
 * @param labels The labels to filter
 * @param last The number of issues to get
 */
export const getLastIssuesWithLabel = (contributors: UserWithStats[], labels: string[], last: number) => {
  const issues = contributors.map(({ issues }) => issues.data).flat();

  const filteredIssues = issues
    .filter((issue, i) => {
      if (issues.findIndex(({ id }) => id === issue.id) !== i) return false;

      const strLabels = issue.labels.map(({ name }) => name);
      return strLabels.some((name) => labels.includes(name));
    })
    .toSorted(cmpCreatedAt);

  return filteredIssues.slice(0, last);
};

/**
 * Get the oldest contribution of a contributor
 * @param contributor The contributor
 */
export const getContributorOldestContribution = (contributor: UserWithStats): Issue | PullRequest | undefined => {
  const contributions = [...contributor.issues.data, ...contributor.prs.data].toSorted(cmpCreatedAt);
  if (!contributions.length) return undefined;

  return contributions[contributions.length - 1];
};

/**
 * Get the x newest contributors
 * @param contributors The contributors
 * @param last The number of contributors to get
 */
export const getNewContributors = (contributors: UserWithStats[], last: number) => {
  const sortedContributors = contributors.toSorted((contributor1, contributor2) => {
    const contributor1LastContribution = getContributorOldestContribution(contributor1);
    const contributor2LastContribution = getContributorOldestContribution(contributor2);
    if (!contributor1LastContribution || !contributor2LastContribution) return 0;

    return cmpCreatedAt(contributor1LastContribution, contributor2LastContribution);
  });

  return sortedContributors.slice(0, last);
};

export const getMilestoneIssues = async (octokit: Octokit, repo: Repository, num: number) => {
  type OctokitIssues = RestEndpointMethodTypes['issues']['listForRepo']['response']['data'];

  const issues: OctokitIssues = [];

  let res: OctokitIssues = [];
  let page = 1;

  do {
    try {
      const issuesRes = await octokit.issues.listForRepo({
        owner: repo.owner,
        repo: repo.repository,
        milestone: num.toString(),
        per_page: 100,
        state: 'all',
        page: page++,
      });

      res = issuesRes.data;
      issues.push(...res);
    } catch (err) {
      console.error(err);

      break;
    }
  } while (res.length === 100);

  return issues;
};

export const getMilestone = async (octokit: Octokit, repo: Repository, num: number) => {
  try {
    const milestoneRes = await octokit.issues.getMilestone({
      milestone_number: num,
      repo: repo.repository,
      owner: repo.owner,
    });

    const issues = await getMilestoneIssues(octokit, repo, num);
    return { ...milestoneRes.data, issues };
  } catch (err) {
    console.error(err);

    return undefined;
  }
};
