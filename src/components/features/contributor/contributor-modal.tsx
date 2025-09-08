'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
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
    <Dialog defaultOpen onOpenChange={handleClose}>
      <DialogContent>
        { children }
      </DialogContent>
    </Dialog>
  );
};

export default ContributorModal;