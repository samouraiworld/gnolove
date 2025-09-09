'use client';

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import RepositoriesSelector from './repositories-selector';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className='flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6 sticky top-0 left-0 right-0 z-50'>
      <div className='flex items-center gap-2 sm:gap-4 flex-1 min-w-0'>
        <SidebarTrigger />

        <div className='w-full sm:w-auto'>
          <Suspense fallback={null}>
            <RepositoriesSelector />
          </Suspense>
        </div>
      </div>

      <div className='flex items-center gap-2 flex-shrink-0'>
        <Button variant='ghost' size='icon' onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Sun className='h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <Moon className='absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
        </Button>
      </div>
    </header>
  );
}

