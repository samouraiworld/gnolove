'use client';

import { Button, Dialog, Flex, IconButton, Text } from '@radix-ui/themes';
import { X } from 'lucide-react';
import { useOffline } from '@/contexts/offline-context';
import Link from 'next/link';

export default function GlobalNotFound() {
  const { isOffline } = useOffline();

  return (
    <Flex direction='column' p='4' gap='3'>
      <Flex justify='between' align='center'>
        <Dialog.Title>Page not found</Dialog.Title>
        <IconButton disabled={isOffline} variant='outline' color='gray' size='1'>
          <X size={16} />
        </IconButton>
      </Flex>
      <Dialog.Description>
        <Text size='2' color='gray'>The page you are looking for doesn&apos;t exist or may have been moved.</Text>
      </Dialog.Description>
      <Flex gap='2'>
        <Button asChild>
          <Link href='/'>Go to homepage</Link>
        </Button>
      </Flex>
    </Flex>
  );
}
