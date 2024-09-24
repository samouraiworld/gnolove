import { graphql } from '@octokit/graphql/types';

import { Repository, User, UserWithStats } from '@/type/github';

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

export const getUserStats = async (client: graphql, repo: Repository, user: User): Promise<UserWithStats> => {
  const query = `
    query($owner: String!, $repository: String!, $id: ID!, $issuesQuery: String!, $pullRequestsQuery: String!) {
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
      
      issues: search(query: $issuesQuery, type: ISSUE) {
        count: issueCount
      }

      pullRequests: search(query: $pullRequestsQuery, type: ISSUE) {
        count: issueCount
      }
    }`;

  const issuesQuery = `repo:${repo.owner}/${repo.repository} author:${user.login} is:issue`;
  const pullRequestsQuery = `repo:${repo.owner}/${repo.repository} author:${user.login} is:pr`;

  const res = await client<{
    commits: { defaultBranchRef: { target: { history: { totalCount: number } } } };
    issues: { count: number };
    pullRequests: { count: number };
  }>(query, { owner: repo.owner, repository: repo.repository, id: user.id, issuesQuery, pullRequestsQuery });

  return {
    ...user,
    commits: res.commits.defaultBranchRef.target.history.totalCount,
    issues: res.issues.count,
    prs: res.pullRequests.count,
  };
};

export const getUsersWithStats = async (client: graphql, repo: Repository): Promise<UserWithStats[]> => {
  const users = await getContributors(client, repo);
  return Promise.all(users.map((user) => getUserStats(client, repo, user)));
};
