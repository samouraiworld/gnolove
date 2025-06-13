'use client';

import { Dialog } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';

const ErrorPage = ({ error }: { error: Error & { digest?: string } }) => {
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
        <div style={{ color: 'red', marginTop: 8 }}>
          {error?.message || 'Unknown error occurred.'}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ErrorPage;