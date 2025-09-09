export interface SearchParamsFilters {
  searchParams: Promise<{
    f?: string | string[] | undefined;
    e?: string | string[] | undefined;
    r?: string | string[] | undefined;
  }>;
}
