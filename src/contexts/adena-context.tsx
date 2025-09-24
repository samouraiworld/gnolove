'use client';

import { createContext, FC, ReactNode, useContext, useLayoutEffect, useState } from 'react';

interface AdenaContext {
  adena: any;
  isLoading: boolean;
  setAdena: (adena: any) => void;
  setIsLoading: (isLoading: boolean) => void;
  handleConnect: () => Promise<void>;
  address: string;
}

const defaultContext = {
  adena: null,
  isLoading: false,
  setAdena: () => {},
  setIsLoading: () => {},
  handleConnect: async () => {},
  address: '',
} satisfies AdenaContext;

export const AdenaContext = createContext<AdenaContext>(defaultContext);

export const useAdena = () => useContext(AdenaContext);

const AdenaProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [adena, setAdena] = useState<any>(defaultContext.adena);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [address, setAddress] = useState<string>('');

  useLayoutEffect(() => {
    // If adena is already in the window, set it
    if (typeof window !== 'undefined' && (window as any)?.adena) {
      setAdena((window as any).adena);
      setIsLoading(false);
    } else {
      // If adena is not in the window, wait for it to be loaded
      setIsLoading(false);
      window.onload = async () => {
        if (typeof window !== 'undefined') {
          setAdena((window as any).adena);
        }
        setIsLoading(false);
      };
    }
  }, []);

  const handleConnect = async () => {
    try {
      await adena.AddEstablish('Adena');
      adena.On('changedAccount', function (address: string){
        setAddress(address);
      });
      try {
        const response = await adena.GetAccount();
        setAddress(response.data?.address);
      } catch (error) {}
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdenaContext.Provider value={{ adena, isLoading, setAdena, setIsLoading, handleConnect, address }}>
      {children}
    </AdenaContext.Provider>
  );
};

export default AdenaProvider;
