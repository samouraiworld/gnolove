import { isAfter, isEqual, parseISO } from 'date-fns';

export const filterContributionsByDateAndRepo = <T extends { [key: string]: any }>(
  contributions: T[] | null | undefined,
  startDate: Date,
  selectedRepositories: string[],
  dateKey: string,
): T[] => {
  if (!contributions) return [];

  const isAfterAndEqual = (date: string) => {
    try {
      const parsedDate = parseISO(date);
      return isAfter(parsedDate, startDate) || isEqual(parsedDate, startDate);
    } catch {
      return false;
    }
  };

  const matchesRepository = (url: string) => {
    if (!selectedRepositories.length) return true;
    return selectedRepositories.some((repo) => {
      const urlPattern = new RegExp(`/${repo}(?:/|$)`);
      return urlPattern.test(url);
    });
  };

  return contributions.filter(
    (item) => isAfterAndEqual(item[dateKey]) && matchesRepository(item.url),
  );
};
