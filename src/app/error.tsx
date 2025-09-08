'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useOffline } from '@/contexts/offline-context';
import Link from 'next/link';

export default function GlobalError({ reset }: { reset: () => void }) {
  const { isOffline } = useOffline();

  return (
    <div className='flex flex-col gap-3 p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Something went wrong</h1>
        <Button disabled={isOffline} variant='outline' size='icon' onClick={reset}>
          <X className='h-4 w-4' />
        </Button>
      </div>
      <p className='text-sm text-muted-foreground'>An unexpected error occurred. You can try again or go back home.</p>
      <div className='flex gap-2'>
        <Button onClick={reset}>Try again</Button>
        <Button variant='outline' asChild>
          <Link href='/'>Go to homepage</Link>
        </Button>
      </div>
    </div>
  );
}
