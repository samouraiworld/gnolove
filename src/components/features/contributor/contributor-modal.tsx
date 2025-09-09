'use client';

import { FC } from 'react';

import { useRouter } from 'next/navigation';

import { Dialog, DialogContent } from '@/components/ui/dialog';

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
      <DialogContent className="max-w-4xl max-h-[calc(100vh-10rem)] overflow-y-auto">{children}</DialogContent>
    </Dialog>
  );
};

export default ContributorModal;
