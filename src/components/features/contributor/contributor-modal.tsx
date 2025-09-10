'use client';

import { FC } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { REPOSITORIES_PARAM_KEY, TIME_FILTER_PARAM_KEY } from '@/constants/search-params';

const ContributorModal: FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (window.history.state?.idx > 0) {
        router.back();
      } else {
        const carry = new URLSearchParams();
        const r = searchParams.get(REPOSITORIES_PARAM_KEY);
        const f = searchParams.get(TIME_FILTER_PARAM_KEY);
        if (r) carry.set(REPOSITORIES_PARAM_KEY, r);
        if (f) carry.set(TIME_FILTER_PARAM_KEY, f);
        const qs = carry.toString();
        router.push(qs ? `/?${qs}` : '/');
      }
    }
  };

  return (
    <Dialog defaultOpen onOpenChange={handleOpenChange}>
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
