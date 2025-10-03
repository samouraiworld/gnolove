'use client';

import { createContext, FC, ReactNode, useContext, useLayoutEffect, useState } from 'react';

import { AdenaSDK } from '@adena-wallet/sdk';

interface AdenaContext {
  adena: AdenaSDK | null;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  handleConnect: () => Promise<void>;
  address: string;
}

const defaultContext = {
  adena: null,
  isLoading: false,
  setIsLoading: () => {},
  handleConnect: async () => {},
  address: '',
} satisfies AdenaContext;

export const AdenaContext = createContext<AdenaContext>(defaultContext);

export const useAdena = () => useContext(AdenaContext);

const AdenaProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [adena, setAdena] = useState<AdenaSDK | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [address, setAddress] = useState<string>('');

  useLayoutEffect(() => {
    // If adena is already in the window, set it
    const adenaIsFound = typeof window !== 'undefined' && (window as any)?.adena;
    if (adenaIsFound) {
      setAdena(AdenaSDK.createAdenaWallet());
      setIsLoading(false);
    } else {
      // If adena is not in the window, wait for it to be loaded
      setIsLoading(false);
      window.onload = async () => {
        const adenaIsFound = typeof window !== 'undefined' && (window as any)?.adena;
        if (adenaIsFound) {
          setAdena(AdenaSDK.createAdenaWallet());
        }
        setIsLoading(false);
      };
    }
  }, []);

  const handleConnect = async () => {
    try {
      if (!adena) return;
      await adena.connectWallet();
      adena.onChangeAccount({
        callback: (address: string) => {
          setAddress(address);
        },
      });
      try {
        const account = await adena.getAccount();
        if (account.data?.address) {
          setAddress(account.data?.address);
        }
      } catch (error) {
        console.error(error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdenaContext.Provider value={{ adena, isLoading, setIsLoading, handleConnect, address }}>
      {children}
    </AdenaContext.Provider>
  );
};

export default AdenaProvider;
