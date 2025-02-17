/**
 * Chunk an array into smaller arrays of a specific size.
 * @param arr The array to chunk
 * @param chunkSize The size of each chunk
 */
export const chunk = <T>(arr: T[], chunkSize: number): T[][] => {
  return [...Array(Math.ceil(arr.length / chunkSize))].map((_) => arr.splice(0, chunkSize));
};

/**
 * Check whether an element is defined or not
 * @param el The element to check
 */
export const isDefined = <T>(el: T | undefined | null): el is T => el !== undefined && el !== null;

/**
 * Get the ids from an array of objects
 * @param arr The array of objects
 */
export const getIds = <T extends { id: string }>(arr: T[]): string[] => {
  return arr.map(({ id }) => id);
};
