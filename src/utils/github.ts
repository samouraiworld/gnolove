import { graphql } from '@octokit/graphql/types';
import { endOfMonth, endOfWeek, endOfYear, format, Interval, startOfMonth, startOfWeek, startOfYear } from 'date-fns';

import { Repository, User, UserWithStats } from '@/type/github';

export enum TimeFilter {
  ALL_TIME = 'All Time',
  YEARLY = 'Yearly',
  MONTHLY = 'Monthly',
  WEEKLY = 'Weekly',
}

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

export const buildSearchQuery = (
  repo: Repository,
  user: User,
  interval: Interval | undefined,
  is: ('issue' | 'pr' | 'merged')[],
) => {
  const query = [`repo:${repo.owner}/${repo.repository}`, `author:${user.login}`, is.map((v) => `is:${v}`)];

  if (interval) {
    const stringyfiedInterval = [interval.start, interval.end].map((value) => format(value, 'yyyy-MM-dd')).join('..');
    query.push(`created:${stringyfiedInterval}`);
  }

  return query.join(' ');
};

export const getUserStats = async (
  client: graphql,
  repo: Repository,
  user: User,
  interval: Interval | undefined,
): Promise<UserWithStats> => {
  const query = `
    query($owner: String!, $repository: String!, $id: ID!, $issuesQuery: String!, $pullRequestsQuery: String!, $mergedRequestsQuery: String!) {
      commits: repository(owner: $owner, name: $repository) {
        defaultBranchRef {
          target {
            ... on Commit {
              history(author: {id: $id}) {
                totalCount
              }
            }
          }
        }
      }
      
      issues: search(query: $issuesQuery, type: ISSUE, first: 100) {
        nodes {
          ... on Issue {
            title
            url
            createdAt
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

      pullRequests: search(query: $pullRequestsQuery, type: ISSUE, first: 100) {
        nodes {
          ... on PullRequest {
            title
            url
            createdAt
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
      
      mergedRequests: search(query: $mergedRequestsQuery, type: ISSUE, first: 100) {
        nodes {
          ... on PullRequest {
            title
            url
            createdAt
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

  type ReturnedNode = {
    title: string;
    url: string;
    createdAt: string;
    labels: { nodes: { name: string; color: string }[] };
  };

  type ReturnedIssues = { nodes: ReturnedNode[]; count: number };
  type ReturnedPullRequests = { nodes: ReturnedNode[]; count: number };
  type ReturnedMergedRequests = { nodes: ReturnedNode[]; count: number };

  type ReturnedCommits = { defaultBranchRef: { target: { history: { totalCount: number } } } };

  const res = await client<{
    commits: ReturnedCommits;
    issues: ReturnedIssues;
    pullRequests: ReturnedPullRequests;
    mergedRequests: ReturnedMergedRequests;
  }>(query, {
    owner: repo.owner,
    repository: repo.repository,
    id: user.id,
    issuesQuery,
    pullRequestsQuery,
    mergedRequestsQuery,
  });

  const mapNodesAndLabels = (nodes: ReturnedNode[]) => {
    return nodes.map(({ labels, ...props }) => ({ ...props, labels: labels.nodes }));
  };

  return {
    ...user,
    commits: res.commits.defaultBranchRef.target.history.totalCount,
    issues: { count: res.issues.count, data: mapNodesAndLabels(res.issues.nodes) },
    prs: { count: res.pullRequests.count, data: mapNodesAndLabels(res.pullRequests.nodes) },
    mrs: { count: res.mergedRequests.count, data: mapNodesAndLabels(res.mergedRequests.nodes) },
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

export const isTimeFilter = (value: string): value is keyof typeof TimeFilter => {
  return value in TimeFilter;
};

export const getTimeFilterFromSearchParam = (
  searchParam: string | string[] | undefined,
  fallback = TimeFilter.ALL_TIME,
) => {
  return searchParam && typeof searchParam === 'string' && isTimeFilter(searchParam)
    ? TimeFilter[searchParam]
    : fallback;
};

export const cmpCreatedAt = <T extends { createdAt: string | Date }>(objA: T, objB: T): number => {
  return new Date(objB.createdAt).getTime() - new Date(objA.createdAt).getTime();
};
