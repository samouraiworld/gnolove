export const filterContributionsByRepo = <T extends { [key: string]: any }>(
  contributions: T[] | null | undefined,
  selectedRepositories: string[],
): T[] => {
  if (!contributions) return [];

  const matchesRepository = (url: string) => {
    if (!selectedRepositories.length) return true;
    return selectedRepositories.some((repo) => {
      const urlPattern = new RegExp(`/${repo}(?:/|$)`);
      return urlPattern.test(url);
    });
  };

  return contributions.filter((item) => matchesRepository(item.url));
};
