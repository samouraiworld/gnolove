'use client';

import { Button, Flex, Heading, Text } from '@radix-ui/themes';
import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <Flex direction='column' p='4' gap='3'>
      <Flex justify='between' align='center'>
        <Heading>Page not found</Heading>
      </Flex>
      <Text size='2' color='gray'>The page you are looking for doesn&apos;t exist or may have been moved.</Text>
      <Flex gap='2'>
        <Button asChild>
          <Link href='/'>Go to homepage</Link>
        </Button>
      </Flex>
    </Flex>
  );
}
