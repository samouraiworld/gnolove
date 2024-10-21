import { NextRequest, NextResponse } from 'next/server';

import { getCachedContributors } from '@/util/contributors';
import { getTimeFilterFromAPISearchParam } from '@/util/github';

export interface Params {
  params: {
    id: string;
  };
}

export const GET = async (request: NextRequest, { params: { id: contributorId } }: Params) => {
  const timeFilter = getTimeFilterFromAPISearchParam(request.nextUrl.searchParams.get('timeFilter'));
  const cachedContributors = await getCachedContributors(timeFilter);

  return NextResponse.json(
    cachedContributors.find(({ id }) => id === contributorId) ??
      cachedContributors.find(({ login }) => login === contributorId),
  );
};
