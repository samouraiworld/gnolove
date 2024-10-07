import { NextRequest, NextResponse } from 'next/server';

import { getCachedContributorsFromTimeFilter } from '@/util/contributors';
import { getLastMRs, TimeFilter } from '@/util/github';

export const GET = async (request: NextRequest) => {
  const parsedLast = parseInt(request.nextUrl.searchParams.get('last') ?? '');
  const last = isNaN(parsedLast) ? 5 : parsedLast;

  const cachedContributors = await getCachedContributorsFromTimeFilter(TimeFilter.ALL_TIME);
  const lastMRs = getLastMRs(cachedContributors, last);

  return NextResponse.json(lastMRs);
};
