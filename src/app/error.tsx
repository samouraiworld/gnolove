'use client';

import { Button, Dialog, Flex, IconButton, Text } from '@radix-ui/themes';
import { X } from 'lucide-react';
import { useOffline } from '@/contexts/offline-context';
import Link from 'next/link';

export default function GlobalError({ reset }: { reset: () => void }) {
  const { isOffline } = useOffline();

  return (
    <Flex direction='column' p='4' gap='3'>
      <Flex justify='between' align='center'>
        <Dialog.Title>Something went wrong</Dialog.Title>
        <IconButton disabled={isOffline} variant='outline' color='gray' size='1' onClick={reset}>
          <X size={16} />
        </IconButton>
      </Flex>
      <Dialog.Description>
        <Text size='2' color='gray'>An unexpected error occurred. You can try again or go back home.</Text>
      </Dialog.Description>
      <Flex gap='2'>
        <Button onClick={reset}>Try again</Button>
        <Button variant='outline' asChild>
          <Link href='/'>Go to homepage</Link>
        </Button>
      </Flex>
    </Flex>
  );
}
