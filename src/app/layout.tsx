import { ReactNode } from 'react';

import { ThemeProvider } from 'next-themes';

import { LinkNone2Icon } from '@radix-ui/react-icons';
import { Button, Flex, Theme } from '@radix-ui/themes';

import '@/style/globals.css';

import ThemeSwitch from '@/module/theme-switch';

import Toaster from '@/element/toast';

import ToastProvider from '@/context/toast-context';

import { AdenaAddress } from '@/components/modules/adena-address';
import { GithubLink } from '@/components/modules/github-link';
import AdenaProvider from '@/contexts/adena-context';

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
            <ToastProvider>
              <AdenaProvider>
                <Toaster />

                <Flex position="fixed" top="4" right="4" className="z-50" gap="2" align="center" justify="center">
                  <AdenaAddress />

                  <GithubLink>
                    <Button variant="soft">
                      <LinkNone2Icon />
                      Link Github Account
                    </Button>
                  </GithubLink>

                  <ThemeSwitch />
                </Flex>

                {children}
              </AdenaProvider>
            </ToastProvider>
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
