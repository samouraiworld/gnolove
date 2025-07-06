'use client';

import { Flex, Button, Badge } from '@radix-ui/themes';
import NextLink from 'next/link';
import { MENU_ITEMS } from '@/constants/menu-items';
import { useOffline } from '@/contexts/offline-context';

const NavHeader = () => {
  const { isOffline } = useOffline();

  return (
    <Flex className='hidden md:flex' align='center' gap='4' px='2'>
      {MENU_ITEMS.map((item) => (
        <Button disabled={isOffline} variant='ghost' asChild key={item.href}>
          <NextLink href={item.href}>
            <span>
              {item.label}
              {item.new && <Badge color='red'>new</Badge>}
            </span>
          </NextLink>
        </Button>
      ))}
    </Flex>
  );
};

export default NavHeader;