import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';

import { hasClerkKeys } from '@/utils/clerk';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  if (!hasClerkKeys) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
};

export default AuthProvider;