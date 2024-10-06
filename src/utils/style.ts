import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tw-merge';

/**
 * Conditionally render and merge the class names of a react component.
 * This is a combination of `clsx` and `twMerge`.
 * @param classList The class names
 * @returns A class list
 */
export const cn = (...classList: ClassValue[]) => twMerge(clsx(classList));

export enum Breakpoint {
  initial = 'initial',
  xs = 'xs',
  sm = 'sm',
  md = 'md',
  lg = 'lg',
  xl = 'xl',
}

export const BREAKPOINTS = {
  [Breakpoint.initial]: 0,
  [Breakpoint.xs]: 520,
  [Breakpoint.sm]: 768,
  [Breakpoint.md]: 1024,
  [Breakpoint.lg]: 1280,
  [Breakpoint.xl]: 1640,
};

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
