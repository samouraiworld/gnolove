'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { TIME_FILTER_PARAM_KEY } from '@/constants/search-params';
import { TimeFilter, getTimeFilterFromSearchParam } from '@/utils/github';

const PARAM_KEY = TIME_FILTER_PARAM_KEY;

/**
 * Returns the selected TimeFilter from the URL search params.
 * Falls back to TimeFilter.MONTHLY when not present/invalid.
 */
export default function useTimeFilter(defaultValue: TimeFilter = TimeFilter.MONTHLY): TimeFilter {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const raw = searchParams.get(PARAM_KEY);
    return getTimeFilterFromSearchParam(raw, defaultValue);
  }, [searchParams, defaultValue]);
}
