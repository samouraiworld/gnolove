'use client';

import { Dialog } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { FC } from 'react';

const ContributorModal: FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <Dialog.Root open={true} onOpenChange={handleClose}>
      <Dialog.Content
        height='88vh'
        maxWidth='1300px'
        style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      >
        { children }
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ContributorModal;