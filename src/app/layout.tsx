import { ReactNode } from 'react';

import { ThemeProvider } from 'next-themes';

import { Theme } from '@radix-ui/themes';

import '@/style/globals.css';

import ThemeSwitch from '@/module/theme-switch';

import Toaster from '@/element/toast';

import ToastProvider from '@/context/toast-context';

interface RootLayoutProps {
  children?: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </head>

      <body>
        <ThemeProvider defaultTheme="light" attribute="class">
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
