import { NextRequest, NextResponse } from 'next/server';

import { getCachedContributors } from '@/util/contributors';
import { getTimeFilterFromAPISearchParam } from '@/util/github';
import { getSortedContributorsWithScore } from '@/util/score';

export const GET = async (request: NextRequest) => {
  const timeFilter = getTimeFilterFromAPISearchParam(request.nextUrl.searchParams.get('timeFilter'));
  const cachedContributors = await getCachedContributors(timeFilter);
  const contributorsWithScore = getSortedContributorsWithScore(cachedContributors);

  return NextResponse.json(contributorsWithScore);
};
