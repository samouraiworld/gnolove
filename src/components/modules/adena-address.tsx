'use client';

import { Text } from '@radix-ui/themes';

import { useAdena } from '@/contexts/adena-context';
import Loader from '@/elements/loader';

export const AdenaAddress = () => {
  const { adena, isLoading } = useAdena();

  if (isLoading) return <Loader />;
  if (!adena)
    return (
      <Text color="yellow" size="2">
        Adena not installed
      </Text>
    );

  return <Text color="green">Adena installed</Text>;
};
