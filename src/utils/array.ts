/**
 * Stringify an array by putting "," and a "and" between each element.
 * @param arr The array to stringify
 * @returns A stringified version of the array
 */
export const arrayToString = (arr: string[]): string => {
  if (arr.length === 1) return arr[0];
  return `${arr.slice(0, arr.length - 1).join(', ')} and ${arr[arr.length - 1]}`;
};

/**
 * Chunk an array into smaller arrays of a specific size.
 * @param arr The array to chunk
 * @param chunkSize The size of each chunk
 */
export const chunk = <T>(arr: T[], chunkSize: number): T[][] => {
  return [...Array(Math.ceil(arr.length / chunkSize))].map((_) => arr.splice(0, chunkSize));
};

export const isDefined = <T>(el: T | undefined | null): el is T => el !== undefined && el !== null;
