'use client';

import { Dialog, Button, IconButton, Flex } from '@radix-ui/themes';
import { X } from 'lucide-react';

const ErrorPage = ({ error, retry }: { error: Error & { digest?: string }, retry: () => void }) => {
  return (
    <Flex direction='column'>
      <Flex justify='between'>
        <Dialog.Title>Something went wrong!</Dialog.Title>
        <Dialog.Close>
          <IconButton variant='ghost' color='gray'>
            <X size={16} />
          </IconButton>
        </Dialog.Close>
      </Flex>
      <Dialog.Description>
        {error?.message || 'Unknown error occurred.'}
      </Dialog.Description>
      <Button
        onClick={retry}
        mt="2"
        style={{ width: '200px' }}
      >
        Retry
      </Button>
    </Flex>
  );
};

export default ErrorPage;