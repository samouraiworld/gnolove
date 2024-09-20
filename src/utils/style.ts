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
