import { Flex, Button, Badge } from '@radix-ui/themes';
import NextLink from 'next/link';

const NavHeader = () => {
  return (
    <Flex className='hidden md:flex' align='center' gap='4' px='2'>
      <Button variant='ghost'>
        <NextLink href='/'>Home</NextLink>
      </Button>

      <Button variant='ghost'>
        <NextLink href='/milestone'>Milestone</NextLink>
      </Button>

      <Button variant='ghost'>
        <NextLink href='/analytics'>
          Analytics
          <Badge color='red'>new</Badge>
        </NextLink>
      </Button>

      <Button variant='ghost'>
        <NextLink href='/tutorials'>
          Tutorials
          <Badge color='red'>new</Badge>
        </NextLink>
      </Button>
    </Flex>

  );
};

export default NavHeader;