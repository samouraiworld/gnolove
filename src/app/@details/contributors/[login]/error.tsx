'use client';

import { Dialog } from '@radix-ui/themes';

const ErrorPage = () => {
  return (
    <Dialog.Root>
      <Dialog.Content>
        <Dialog.Title>Something went wrong!</Dialog.Title>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ErrorPage;