'use client';

import { usePathname } from 'next/navigation';

import { Button } from '@radix-ui/themes';

import Loader from '@/elements/loader';

import { useAdena } from '@/contexts/adena-context';

export default function ConnectWalletButton() {
  const path = usePathname();
  const { adena, isLoading, handleConnect, address } = useAdena();
  if (isLoading) return <Loader />;

  return (
    <>
      {path === '/govdao' && adena && address === '' && (
        <Button className="" variant="outline" radius="full" color="gray" onClick={handleConnect}>
          Connect wallet
        </Button>
      )}
      {address && (
        <Button disabled className="" variant="outline" radius="full" color="green" onClick={handleConnect}>
          {address.slice(0, 4)}...{address.slice(-5)}
        </Button>
      )}
    </>
  );
}
