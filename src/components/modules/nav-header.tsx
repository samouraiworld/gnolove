'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NextLink from 'next/link';
import { MENU_ITEMS } from '@/constants/menu-items';
import { useOffline } from '@/contexts/offline-context';

const NavHeader = () => {
  const { isOffline } = useOffline();

  return (
    <div className='hidden md:flex items-center gap-4 px-2'>
      {MENU_ITEMS.map((item) => (
        <Button disabled={isOffline} variant='ghost' asChild key={item.href}>
          <NextLink href={item.href}>
            <span>
              {item.label}
              {item.new && <Badge variant='destructive' className='ml-2'>new</Badge>}
            </span>
          </NextLink>
        </Button>
      ))}
    </div>
  );
};

export default NavHeader;