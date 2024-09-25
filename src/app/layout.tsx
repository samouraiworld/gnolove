import { ReactNode } from 'react';

import { ThemeProvider } from 'next-themes';

import { Theme } from '@radix-ui/themes';

import '@/style/globals.css';

import ThemeSwitch from '@/module/theme-switch';

import Toaster from '@/element/toast';

import ToastProvider from '@/context/toast-context';

interface IProps {
  children?: ReactNode;
}

const RootLayout = ({ children }: IProps) => {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class">
          <Theme>
            <ThemeSwitch />

            <ToastProvider>
              <Toaster />

              {children}
            </ToastProvider>
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
