import { TRepository } from '@/utils/schemas';

export const getSelectedRepositoriesFromSearchParam = (
  searchParam: string | string[] | undefined,
  repositories: TRepository[],
) => {
  if (!searchParam) return [];

  const names = Array.isArray(searchParam) ? searchParam : [searchParam];
  return repositories.filter(({ id }) => names.includes(id));
};
