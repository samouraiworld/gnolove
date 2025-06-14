'use client';

import { Dialog } from '@radix-ui/themes';

const ErrorPage = ({ error }: { error: Error & { digest?: string } }) => {
  return (
    <>
      <Dialog.Title>Something went wrong!</Dialog.Title>
      <Dialog.Description>
        {error?.message || 'Unknown error occurred.'}
      </Dialog.Description>
    </>
  );
};

export default ErrorPage;