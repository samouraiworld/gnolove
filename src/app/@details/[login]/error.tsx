'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const ErrorPage = ({ reset }: { reset: () => void }) => {
  return (
    <Dialog open>
      <DialogContent>
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
