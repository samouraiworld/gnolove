'use client';

import { Dialog, Flex } from '@radix-ui/themes';

import Loader from '@/elements/loader';

const Loading = () => {
  return (
    <Flex align="center" gap="2">
      <Dialog.Title mb="0">Loading...</Dialog.Title>
      <Loader width={24} height={24} />
    </Flex>
  );
};

export default Loading;
