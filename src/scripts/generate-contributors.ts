/* eslint-disable no-console */
import { writeFileSync } from 'node:fs';

import graphql from '@/instance/graphql';

import { getUsersWithStats } from '@/util/github';

import REPOSITORY from '@/constant/repository';

const main = async () => {
  console.log(`> Generating the contributors for repository '${REPOSITORY.owner}/${REPOSITORY.repository}'.`);

  const res = await getUsersWithStats(graphql, REPOSITORY);
  const jsonStr = JSON.stringify(res, null, 2);
  writeFileSync('src/constants/contributors.ts', `const data = ${jsonStr};\n\nexport default data;`);

  console.log(`> Generated ${res.length} contributors.`);
};

void main();
