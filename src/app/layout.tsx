import '@/styles/globals.css';
import { ReactNode } from 'react';

import { ThemeProvider } from 'next-themes';

import { LinkNone2Icon } from '@radix-ui/react-icons';
import { Box, Button, Flex, Theme } from '@radix-ui/themes';

import ThemeSwitch from '@/modules/theme-switch';

import Toaster from '@/elements/toast';

import ToastProvider from '@/contexts/toast-context';

import { AdenaAddress } from '@/modules/adena-address';
import { GithubLink } from '@/modules/github-link';
import AdenaProvider from '@/contexts/adena-context';
import QueryClientWrapper from '@/wrappers/query-client';
import MobileNavDrawer from '@/modules/mobile-nav-drawer';
import NavHeader from '@/modules/nav-header';

import { Analytics } from '@vercel/analytics/next';

import { OfflineProvider } from '@/contexts/offline-context';
import OfflineBanner from '@/elements/offline-banner';

interface RootLayoutProps {
  children?: ReactNode;
  details?: ReactNode;
}

const RootLayout = ({ children, details }: RootLayoutProps) => {
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
        <OfflineProvider>
          <QueryClientWrapper>
            <ThemeProvider defaultTheme="light" attribute="class">
              <Theme>
                <ToastProvider>
                  <AdenaProvider>
                    <Toaster />

                    <Box
                      position="fixed"
                      top="0"
                      left="0"
                      width="100%"
                      p="2"
                      className="z-50"
                      style={{ background: 'var(--accent-1)', borderBottom: '1px solid var(--gray-a3)' }}
                    >
                      <Flex justify="between" align="center">

                        <MobileNavDrawer />
                        <NavHeader />
                        <Flex gap="2" align="center" justify="end">
                          <Flex gap="2" align="center" hidden>
                            <AdenaAddress />

                            <GithubLink>
                              <Button variant="soft">
                                <LinkNone2Icon />
                                Link Github Account
                              </Button>
                            </GithubLink>
                          </Flex>

                          <ThemeSwitch />
                        </Flex>
                      </Flex>
                    </Box>

                    {children}

                    {details}
                  </AdenaProvider>
                </ToastProvider>
              </Theme>
            </ThemeProvider>
          </QueryClientWrapper>
          <OfflineBanner />
          <Analytics />
        </OfflineProvider>
      </body>
    </html>
  );
};

export default RootLayout;
