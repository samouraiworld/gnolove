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
      <DialogContent
        className="
          top-0 left-0 translate-x-0 translate-y-0 h-[100dvh] max-h-[100dvh] w-screen rounded-none p-4
          pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
          overflow-hidden sm:overflow-auto
          sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:h-auto sm:max-h-[calc(100vh-4rem)] sm:w-full sm:max-w-4xl sm:rounded-lg sm:p-6
        "
      >
        <div className="flex h-full min-h-0 flex-col overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContributorModal;
