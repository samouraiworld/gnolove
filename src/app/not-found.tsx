'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <div className='flex flex-col gap-3 p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Page not found</h1>
      </div>
      <p className='text-sm text-muted-foreground'>The page you are looking for doesn&apos;t exist or may have been moved.</p>
      <div className='flex gap-2'>
        <Button asChild>
          <Link href='/'>Go to homepage</Link>
        </Button>
      </div>
    </div>
  );
}
