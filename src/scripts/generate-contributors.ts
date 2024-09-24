/* eslint-disable no-console */
import { writeFileSync } from 'node:fs';

import graphql from '@/instance/graphql';

import { getUsersWithStats, TimeFilter } from '@/util/github';

import REPOSITORY from '@/constant/repository';

import { UserWithStats } from '@/type/github';

const main = async () => {
  const TIME_FILTERS = [TimeFilter.MONTHLY, TimeFilter.WEEKLY, TimeFilter.YEARLY, TimeFilter.ALL_TIME];
  const STR_REPO = `${REPOSITORY.owner}/${REPOSITORY.repository}`;

  const data: Record<string, UserWithStats[]> = {};

  for (const timeFilter of TIME_FILTERS) {
    console.log(`> Generating the contributors for repository '${STR_REPO}' with TimeFilter: ${timeFilter}.`);

    const res = await getUsersWithStats(graphql, REPOSITORY, timeFilter);
    data[timeFilter] = res;

    console.log(
      `> Generated ${res.length} contributors for repository '${STR_REPO}' with TimeFilter: ${timeFilter}.\n`,
    );
  }

  const jsonStr = JSON.stringify(data, null, 2);
  writeFileSync('src/constants/contributors.ts', `const data = ${jsonStr};\n\nexport default data;`);
};

void main();
