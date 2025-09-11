'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { REPOSITORIES_PARAM_KEY } from '@/constants/search-params';

const PARAM_KEY = REPOSITORIES_PARAM_KEY;

/**
 * Returns the array of selected repository IDs (e.g., 'owner/name') from the URL search params.
 * If none are selected, returns an empty array meaning 'all repositories'.
 */
export default function useSelectedRepositories(): string[] {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const raw = searchParams.get(PARAM_KEY);
    if (!raw) return [] as string[];
    return raw.split(',').filter(Boolean);
  }, [searchParams]);
}
