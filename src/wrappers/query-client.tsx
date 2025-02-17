'use client';

import { ReactNode } from 'react';

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const makeQueryClient = () => {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000 } } });
};

let browserQueryClient: QueryClient | undefined = undefined;

const getQueryClient = () => {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
};

export interface QueryClientWrapperProps {
  children?: ReactNode;
}

const QueryClientWrapper = ({ children }: QueryClientWrapperProps) => {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default QueryClientWrapper;
