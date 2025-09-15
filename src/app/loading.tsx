import React from 'react';

import Loader from '@/elements/loader';

const LoadingPage = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <Loader />
    </div>
  );
};

export default LoadingPage;
