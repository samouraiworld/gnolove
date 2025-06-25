'use client';

import { Dialog, Button, IconButton, Flex } from '@radix-ui/themes';
import { X } from 'lucide-react';

const ErrorPage = ({ reset }: { reset: () => void }) => {
  return (
    <Flex direction='column'>
      <Flex justify='between'>
        <Dialog.Title>Something went wrong!</Dialog.Title>
        <Dialog.Close>
          <IconButton variant='outline' color='gray' size='1'>
            <X size={16} />
          </IconButton>
        </Dialog.Close>
      </Flex>
      <Dialog.Description>
        We&apos;re sorry, but an unexpected error occurred. Please try again later.
      </Dialog.Description>
      <Button
        onClick={reset}
        mt="2"
        style={{ width: '200px' }}
      >
        Try again
      </Button>
    </Flex>
  );
};

export default ErrorPage;