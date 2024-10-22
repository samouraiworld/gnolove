import { ReactNode } from 'react';

declare global {
  export interface AsyncVoidFunction {
    (): Promise<void>;
  }

  export interface IPropsWithChildren {
    children?: ReactNode;
  }

  type NoUndefined<T> = T extends undefined ? never : T;

  export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
    ? ElementType
    : never;
}

export default global;
