'use client';

import { Spinner, Text } from '@radix-ui/themes';

import { useAdena } from '@/contexts/adena-context';

export const AdenaAddress = () => {
  const { adena, isLoading } = useAdena();

  if (isLoading) return <Spinner />;
  if (!adena)
    return (
      <Text color="yellow" size="2">
        Adena not installed
      </Text>
    );

  return <Text color="green">Adena installed</Text>;
};
