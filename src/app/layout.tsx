import { ReactNode } from 'react';

import { Theme } from '@radix-ui/themes';

import '@/style/globals.css';

import Toaster from '@/element/toast';

import ToastProvider from '@/context/toast-context';

interface IProps {
  children?: ReactNode;
}

const RootLayout = ({ children }: IProps) => {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Toaster />

          <Theme>{children}</Theme>
        </ToastProvider>
      </body>
    </html>
  );
};

export default RootLayout;
