/* eslint-disable no-console */
import { graphql } from '@octokit/graphql';
import { writeFileSync } from 'node:fs';

import { getUsersWithStats } from '@/util/github';

import { Repository } from '@/type/github';

import ENV from '@/env';

const main = async () => {
  const repo: Repository = {
    owner: 'gnolang',
    repository: 'gno',
  };

  const graphqlWithAuth = graphql.defaults({
    headers: { authorization: `token ${ENV.GITHUB_TOKEN}` },
  });

  console.log(`> Generating the contributors for repository '${repo.owner}/${repo.repository}'.`);

  const res = await getUsersWithStats(graphqlWithAuth, repo);
  const jsonStr = JSON.stringify(res, null, 2);
  writeFileSync('src/constants/contributors.ts', `const data = ${jsonStr};\n\nexport default data;`);

  console.log(`> Generated ${res.length} contributors.`);
};

void main();
