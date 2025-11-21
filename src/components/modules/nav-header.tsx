'use client';

import { Flex, Button, Badge, DropdownMenu, ChevronDownIcon } from '@radix-ui/themes';
import NextLink from 'next/link';
import { MENU_ITEMS, MenuItem } from '@/constants/menu-items';
import { useOffline } from '@/contexts/offline-context';

const NavHeader = () => {
  const { isOffline } = useOffline();

  const renderMenuItem = (item: MenuItem) => {
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
            {item.subItems.map((subItem: MenuItem) => (
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
    <Flex className='hidden md:flex' align='center' gap='6' px='4'>
      {MENU_ITEMS.map(renderMenuItem)}
    </Flex>
  );
};

export default NavHeader;