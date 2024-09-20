import type { ReactElement } from 'react';

import { Metadata } from 'next';

import { Flex, Heading } from '@radix-ui/themes';

export const metadata: Metadata = {
  title: 'Next.js App Router',
};

const HomePage = (): ReactElement => {
  return (
    <Flex p="6" justify="center" align="center" className="h-screen w-screen">
      <Heading as="h1">Hello world!</Heading>
    </Flex>
  );
};

export default HomePage;
