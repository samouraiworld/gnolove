'use client';

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import RepositoriesSelector from './repositories-selector';
import TimeFilterSelector from './time-filter-selector';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className='sticky top-0 left-0 right-0 z-50 border-b border-border bg-background px-4 sm:px-6'>
      <div className='flex h-16 items-center justify-between'>
        <div className='flex items-center gap-1 sm:gap-4'>
          <SidebarTrigger />
          <Suspense fallback={null}>
            <RepositoriesSelector />
          </Suspense>
          <Suspense fallback={null}>
            <TimeFilterSelector />
          </Suspense>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='icon' onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className='h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
            <Moon className='absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          </Button>
        </div>
      </div>
    </header>
  );
}

