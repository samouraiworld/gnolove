/* eslint-disable no-console */
import { graphql } from '@octokit/graphql';
import { writeFileSync } from 'node:fs';

import { User, UserWithStats } from '@/type/github';

const graphqlWithAuth = graphql.defaults({
  headers: { authorization: 'token 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' },
});

const getMentionableUsers = async (owner: string, repository: string): Promise<User[]> => {
  const query = `
    query($owner: String!, $repository: String!) {
      repository(owner: $owner, name: $repository) {
        mentionableUsers(first: 50) {
          nodes {
            id
            login
            avatarUrl
            url
            name
          }
        }
      }
    }`;

  const res = await graphqlWithAuth<{
    repository: {
      mentionableUsers: { nodes: { id: string; login: string; avatarUrl: string; url: string; name: string }[] };
    };
  }>(query, {
    owner,
    repository,
  });

  return res.repository.mentionableUsers.nodes;
};

const getUserStats = async (owner: string, repository: string, user: User): Promise<UserWithStats> => {
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

  const issuesQuery = `repo:${owner}/${repository} author:${user.login} is:issue`;
  const pullRequestsQuery = `repo:${owner}/${repository} author:${user.login} is:pr`;

  const res = await graphqlWithAuth<{
    commits: { defaultBranchRef: { target: { history: { totalCount: number } } } };
    issues: { count: number };
    pullRequests: { count: number };
  }>(query, { owner, repository, id: user.id, issuesQuery, pullRequestsQuery });

  return {
    ...user,
    commits: res.commits.defaultBranchRef.target.history.totalCount,
    issues: res.issues.count,
    prs: res.pullRequests.count,
  };
};

const getUsersWithStats = async (owner: string, repo: string): Promise<UserWithStats[]> => {
  const users = await getMentionableUsers(owner, repo);
  return Promise.all(users.map((user) => getUserStats(owner, repo, user)));
};

const main = async () => {
  const owner = 'gnolang';
  const repo = 'gno';

  console.log(`> Generating the contributors for repository '${owner}/${repo}'.`);

  const res = await getUsersWithStats(owner, repo);
  const jsonStr = JSON.stringify(res, null, 2);
  writeFileSync('src/constants/contributors.ts', `const data = ${jsonStr};\n\nexport default data;`);

  console.log(`> Generated ${res.length} contributors.`);
};

void main();
