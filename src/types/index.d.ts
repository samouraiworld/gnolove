import { ReactNode } from 'react';

declare global {
  export interface AsyncVoidFunction {
    (): Promise<void>;
  }

  export interface IPropsWithChildren {
    children?: ReactNode;
  }
}

export default global;
