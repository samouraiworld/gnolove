'use client';

import { Dialog, IconButton, Flex, Text, Button } from '@radix-ui/themes';
import { X } from 'lucide-react';
import { useOffline } from '@/contexts/offline-context';
import Link from 'next/link';

const NotFoundPage = () => {
  const { isOffline } = useOffline();

  return (
    <Flex direction='column'>
      <Flex justify='between' align='center'>
        <Dialog.Title>Contributor not found</Dialog.Title>
        <Dialog.Close>
          <IconButton disabled={isOffline} variant='outline' color='gray' size='1'>
            <X size={16} />
          </IconButton>
        </Dialog.Close>
      </Flex>
      <Dialog.Description>
        <Text size='2' color='gray'>We couldn&apos;t find this contributor. The profile may not exist or may have been removed.</Text>
      </Dialog.Description>
      <Flex mt='2' gap='2'>
        <Button asChild>
          <Link href='/'>Go to homepage</Link>
        </Button>
      </Flex>
    </Flex>
  );
};

export default NotFoundPage;
