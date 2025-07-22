import { isAfter, isEqual, parseISO } from 'date-fns';

export const filterContributionsByDateAndRepo = <T extends { [key: string]: any }>(
  contributions: T[] | null | undefined,
  startDate: Date,
  selectedRepositories: string[],
  dateKey: string,
): T[] => {
  if (!contributions) return [];

  const isAfterAndEqual = (date: string) => {
    const parsedDate = parseISO(date);
    return isAfter(parsedDate, startDate) || isEqual(parsedDate, startDate);
  };

  return contributions.filter(
    (item) =>
      isAfterAndEqual(item[dateKey]) &&
      (selectedRepositories.length ? selectedRepositories.some((repo) => item.url.includes(repo)) : true),
  );
};
