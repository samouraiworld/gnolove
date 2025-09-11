import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Conditionally render and merge the class names of a React component.
 * This is a combination of `clsx` and `twMerge`.
 * @param classList The class names
 * @returns A class list
 */
export const cn = (...classList: ClassValue[]) => twMerge(clsx(classList));

/**
 * Convert a hex color to an RGB color
 * @param hex The hex color to convert
 */
export const hexToRGB = (hex: string): [number, number, number] => {
  // Remove the '#' symbol if present
  hex = hex.replace('#', '');

  // Convert the hex value to decimal
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return [r, g, b];
};
