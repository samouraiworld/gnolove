'use client';

import { Dialog, Flex, Spinner } from '@radix-ui/themes';

const Loading = () => {
  return (
    <Flex align='center' gap='2'>
      <Dialog.Title mb='0'>Loading...</Dialog.Title>
      <Spinner />
    </Flex>
  );
};

export default Loading;
