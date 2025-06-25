import { Flex, Button, Badge } from '@radix-ui/themes';
import NextLink from 'next/link';
import { MENU_ITEMS } from '@/constants/menu-items';

const NavHeader = () => {
  return (
    <Flex className='hidden md:flex' align='center' gap='4' px='2'>
      {MENU_ITEMS.map((item) => (
        <NextLink href={item.href} key={item.href}>
          <Button variant='ghost' asChild>
            <span>
              {item.label}
              {item.new && <Badge color='red'>new</Badge>}
            </span>
          </Button>
        </NextLink>
      ))}
    </Flex>
  );
};

export default NavHeader;