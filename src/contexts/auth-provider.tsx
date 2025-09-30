import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';

import { isClerkEnabled } from '@/utils/clerk';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  if (!isClerkEnabled) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
};

export default AuthProvider;