'use client';

import { Dialog, Button, Flex, IconButton } from '@radix-ui/themes';
import { X } from 'lucide-react';

import { useOffline } from '@/contexts/offline-context';

const ErrorPage = ({ reset }: { reset: () => void }) => {
  const { isOffline } = useOffline();

  return (
    <Flex direction="column" align="center" gap="4">
      <Dialog.Close className="absolute right-4 top-2">
        <IconButton disabled={isOffline} variant="outline" color="gray" size="1">
          <X size={16} />
        </IconButton>
      </Dialog.Close>
      <Dialog.Title mb="0">Something went wrong!</Dialog.Title>
      <Dialog.Description>
        We&apos;re sorry, but an unexpected error occurred. Please try again later.
      </Dialog.Description>
      <Button onClick={reset} style={{ width: '200px' }}>
        Try again
      </Button>
    </Flex>
  );
};

export default ErrorPage;
