'use client';

import { Dialog } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';

const ErrorPage = () => {
  const router = useRouter();

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <Dialog.Root open onOpenChange={handleClose}>
      <Dialog.Content>
        <Dialog.Title>Something went wrong!</Dialog.Title>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ErrorPage;