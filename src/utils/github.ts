import { format, parseISO } from 'date-fns';

import { isDefined } from '@/utils/array';
import { TEnhancedUserWithStats } from '@/utils/schemas';

export enum TimeFilter {
  ALL_TIME = 'all',
  YEARLY = 'yearly',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
}

/**
 * Util function to check if the value is a TimeFilter
 * @param value The value to check
 */
export const isTimeFilter = (value: string): value is TimeFilter => {
  return Object.values(TimeFilter).includes(value as TimeFilter);
};

/**
 * Get the time filter from a search parameter
 * @param searchParam The search parameter
 * @param fallback Default value in case the searchParam filter is invalid
 */
export const getTimeFilterFromSearchParam = (
  searchParam: string | string[] | undefined | null,
  fallback = TimeFilter.ALL_TIME,
) => {
  return searchParam && typeof searchParam === 'string' && isTimeFilter(searchParam)
    ? (searchParam as TimeFilter)
    : fallback;
};

type CreatedAtKind = { createdAt: string | Date } | { created_at: string | Date } | { CreatedAt: string | Date };

/**
 * Returns the createdAt property of an object
 * @param obj The object
 */
const getCreatedAt = (obj: CreatedAtKind): string | Date => {
  return 'createdAt' in obj ? obj.createdAt : 'created_at' in obj ? obj.created_at : obj.CreatedAt;
};

/**
 * Util function to compare the createdAt property of two objects
 * @param objA Object A
 * @param objB Object B
 */
export const cmpCreatedAt = <T extends CreatedAtKind>(objA: T, objB: T): number => {
  return new Date(getCreatedAt(objB)).getTime() - new Date(getCreatedAt(objA)).getTime();
};

/**
 * Util function to compare the updatedAt property of two objects
 * @param objA Object A
 * @param objB Object B
 */
export const cmpUpdatedAt = <T extends { createdAt: string | Date }>(objA: T, objB: T): number => {
  return new Date(objB.createdAt).getTime() - new Date(objA.createdAt).getTime();
};

/**
 * Get the last MRs from a list of contributors
 * @param contributors The contributors
 * @param last The number of MRs to get
 */
export const getLastMRs = (contributors: TEnhancedUserWithStats[], last: number) => {
  const prs = contributors
    .map(({ pullRequests }) => pullRequests)
    .filter(isDefined)
    .flat();

  return prs
    .filter(({ state }) => state === 'MERGED')
    .toSorted(cmpUpdatedAt)
    .slice(0, last);
};

/**
 * Utility function to determine the chunking key based on the TimeFilter.
 * @param date The date to format.
 * @param timeFilter The selected TimeFilter.
 * @returns A formatted string representing the chunking key.
 */
export const getChunkKeyByTimeFilter = (date: string | Date, timeFilter: TimeFilter): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  switch (timeFilter) {
    case TimeFilter.WEEKLY:
      return format(parsedDate, 'EEE');
    case TimeFilter.MONTHLY:
      return format(parsedDate, 'yyyy-MM-dd');
    case TimeFilter.YEARLY:
      return format(parsedDate, 'yyyy-MM');
    case TimeFilter.ALL_TIME:
      return format(parsedDate, 'yyyy');
    default:
      return format(parsedDate, 'yyyy-MM-dd');
  }
};
