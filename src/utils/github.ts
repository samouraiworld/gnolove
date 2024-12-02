import { endOfMonth, endOfWeek, endOfYear, Interval, startOfMonth, startOfWeek, startOfYear } from 'date-fns';

import { isDefined } from '@/util/array';
import { TEnhancedUserWithStats } from '@/util/schemas';

export enum TimeFilter {
  ALL_TIME = 'All Time',
  YEARLY = 'Yearly',
  MONTHLY = 'Monthly',
  WEEKLY = 'Weekly',
}

/**
 * Get the interval of a specific time filter
 * @param timeFilter The time filter
 */
export const getTimeFilterInterval = (timeFilter: TimeFilter | undefined): Interval | undefined => {
  const now = new Date();

  switch (timeFilter) {
    case TimeFilter.WEEKLY:
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };

    case TimeFilter.MONTHLY:
      return { start: startOfMonth(now), end: endOfMonth(now) };

    case TimeFilter.YEARLY:
      return { start: startOfYear(now), end: endOfYear(now) };

    default:
      return undefined;
  }
};

/**
 * Util function to check if the value is a TimeFilter
 * @param value The value to check
 */
export const isTimeFilter = (value: string): value is keyof typeof TimeFilter => {
  return value in TimeFilter;
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
    ? TimeFilter[searchParam]
    : fallback;
};

export const getTimeFilterFromAPISearchParam = (
  searchParam: string | string[] | undefined | null,
  fallback = TimeFilter.ALL_TIME,
) => {
  switch (searchParam) {
    case 'all_time':
      return TimeFilter.ALL_TIME;
    case 'yearly':
      return TimeFilter.YEARLY;
    case 'monthly':
      return TimeFilter.MONTHLY;
    case 'weekly':
      return TimeFilter.WEEKLY;
    default:
      return fallback;
  }
};

type CreatedAtKind = { createdAt: string | Date } | { created_at: string | Date } | { CreatedAt: string | Date };

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
 * Get the last issues with a specific label from a list of contributors
 * @param contributors The contributors
 * @param labels The labels to filter
 * @param last The number of issues to get
 */
export const getLastIssuesWithLabel = (contributors: TEnhancedUserWithStats[], labels: string[], last: number) => {
  const issues = contributors
    .map(({ issues }) => issues)
    .filter(isDefined)
    .flat();

  const filteredIssues = issues
    .filter((issue, i) => {
      if (issues.findIndex(({ id }) => id === issue.id) !== i) return false;

      const strLabels = issue.labels.map(({ name }) => name);
      return strLabels.some((name) => labels.includes(name));
    })
    .toSorted(cmpCreatedAt);

  return filteredIssues.slice(0, last);
};

/**
 * Get the x newest contributors
 * @param contributors The contributors
 * @param last The number of contributors to get
 */
export const getNewContributors = (contributors: TEnhancedUserWithStats[], last: number) => {
  const sortedContributors = contributors.toSorted((contributor1, contributor2) => {
    if (!contributor1.LastContribution || !contributor2.LastContribution) return 0;

    return cmpCreatedAt(contributor1.LastContribution, contributor2.LastContribution);
  });

  return sortedContributors.slice(0, last);
};
