'use client';

import { Flex, Button, Badge, DropdownMenu, ChevronDownIcon } from '@radix-ui/themes';
import NextLink from 'next/link';
import { MENU_ITEMS } from '@/constants/menu-items';
import { useOffline } from '@/contexts/offline-context';

const NavHeader = () => {
  const { isOffline } = useOffline();

  const renderMenuItem = (item: any) => {
    if (item.subItems && item.subItems.length > 0) {
      return (
        <DropdownMenu.Root key={item.href}>
          <DropdownMenu.Trigger disabled={isOffline}>
            <Button variant='ghost'>
              <Flex align='center' gap='1'>
                {item.label}
                {item.new && <Badge color='red'>new</Badge>}
                <ChevronDownIcon />
              </Flex>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {item.subItems.map((subItem: any) => (
              <DropdownMenu.Item key={subItem.href} asChild>
                <NextLink href={subItem.href}>
                  <Flex align='center' gap='2'>
                    {subItem.label}
                    {subItem.new && <Badge color='red'>new</Badge>}
                  </Flex>
                </NextLink>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      );
    }

    return (
      <Button disabled={isOffline} variant='ghost' asChild key={item.href}>
        <NextLink href={item.href}>
          <span>
            {item.label}
            {item.new && <Badge color='red'>new</Badge>}
          </span>
        </NextLink>
      </Button>
    );
  };

  return (
    <Flex className='hidden md:flex' align='center' gap='4' px='2'>
      {MENU_ITEMS.map(renderMenuItem)}
    </Flex>
  );
};

export default NavHeader;