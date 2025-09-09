'use client';

import { X } from 'lucide-react';

import { useOffline } from '@/contexts/offline-context';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const ErrorPage = ({ reset }: { reset: () => void }) => {
  const { isOffline } = useOffline();

  return (
    <Dialog open>
      <DialogContent>
        <DialogClose asChild>
          <Button disabled={isOffline} variant="outline" size="icon" className="absolute top-2 right-4">
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>
        <DialogTitle>Something went wrong!</DialogTitle>
        <DialogDescription>
          We&apos;re sorry, but an unexpected error occurred. Please try again later.
        </DialogDescription>
        <Button onClick={reset} className="w-[200px]">
          Try again
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorPage;
