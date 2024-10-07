import { NextRequest, NextResponse } from 'next/server';

import { getCachedContributorsFromTimeFilter } from '@/util/contributors';
import { getTimeFilterFromAPISearchParam } from '@/util/github';
import { getSortedContributorsWithScore } from '@/util/score';

export interface Params {
  params: {
    rank: string;
  };
}

export const GET = async (request: NextRequest, { params: { rank: rawRank } }: Params) => {
  const timeFilter = getTimeFilterFromAPISearchParam(request.nextUrl.searchParams.get('timeFilter'));
  const cachedContributors = await getCachedContributorsFromTimeFilter(timeFilter);
  const contributorsWithScore = getSortedContributorsWithScore(cachedContributors);

  const parsedRank = parseInt(rawRank ?? '');
  const rank = Math.max(Math.min(isNaN(parsedRank) ? 1 : parsedRank, contributorsWithScore.length), 1);

  return NextResponse.json(contributorsWithScore[rank - 1]);
};
