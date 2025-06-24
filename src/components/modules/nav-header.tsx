import { Flex, Button, Badge } from '@radix-ui/themes';
import NextLink from 'next/link';
import { MENU_ITEMS } from '@/constants/menu-items';

const NavHeader = () => {
  return (
    <Flex className='hidden md:flex' align='center' gap='4' px='2'>
      {MENU_ITEMS.map((item) => (
        <Button variant='ghost' key={item.href}>
          <NextLink href={item.href}>
            {item.label}
            {item.new && <Badge color='red'>new</Badge>}
          </NextLink>
        </Button>
      ))}
    </Flex>
  );
};

export default NavHeader;