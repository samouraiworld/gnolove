import { TimeFilter } from '@/util/github';
import { TRepository } from '@/util/schemas';

export const getSelectedRepositoriesFromSearchParam = (
  searchParam: string | string[] | undefined,
  repositories: TRepository[],
) => {
  if (!searchParam) return [];

  const names = Array.isArray(searchParam) ? searchParam : [searchParam];
  return repositories.filter(({ id }) => names.includes(id));
};
