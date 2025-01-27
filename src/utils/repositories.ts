import { TimeFilter } from '@/util/github';
import { TRepository } from '@/util/schemas';

export const getParameterFromTimeFilter = (timeFilter: TimeFilter) => {
  switch (timeFilter) {
    case TimeFilter.MONTHLY:
      return 'monthly';
    case TimeFilter.WEEKLY:
      return 'weekly';
    case TimeFilter.ALL_TIME:
      return 'all';
    default:
      return 'all';
  }
};

export const getSelectedRepositoriesFromSearchParam = (
  searchParam: string | string[] | undefined,
  repositories: TRepository[],
) => {
  if (!searchParam) return [];

  const names = Array.isArray(searchParam) ? searchParam : [searchParam];
  return repositories.filter(({ id }) => names.includes(id));
};
