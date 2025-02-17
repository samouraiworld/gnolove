'use client';

import { createContext, FC, ReactNode, useContext, useLayoutEffect, useState } from 'react';

interface AdenaContext {
  adena: any;
  isLoading: boolean;
  setAdena: (adena: any) => void;
  setIsLoading: (isLoading: boolean) => void;
}

const defaultContext = {
  adena: null,
  isLoading: false,
  setAdena: () => {},
  setIsLoading: () => {},
} satisfies AdenaContext;

export const AdenaContext = createContext<AdenaContext>(defaultContext);

export const useAdena = () => useContext(AdenaContext);

const AdenaProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [adena, setAdena] = useState<any>(defaultContext.adena);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useLayoutEffect(() => {
    // If adena is already in the window, set it
    if (typeof window !== 'undefined' && (window as any)?.adena) {
      setAdena((window as any).adena);
      setIsLoading(false);
    } else {
      // If adena is not in the window, wait for it to be loaded
      window.onload = async () => {
        if (typeof window !== 'undefined') {
          setAdena((window as any).adena);
        }
        setIsLoading(false);
      };
    }
  }, []);

  return <AdenaContext.Provider value={{ adena, isLoading, setAdena, setIsLoading }}>{children}</AdenaContext.Provider>;
};

export default AdenaProvider;
