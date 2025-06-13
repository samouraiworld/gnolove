import { ReactNode } from 'react';

import { ThemeProvider } from 'next-themes';
import NextLink from 'next/link';

import { LinkNone2Icon } from '@radix-ui/react-icons';
import { Badge, Box, Button, Flex, Theme } from '@radix-ui/themes';

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

                <Box
                  position="fixed"
                  top="0"
                  left="0"
                  width="100%"
                  p="2"
                  className="z-50 z-[99]"
                  style={{ background: 'var(--accent-1)', borderBottom: '1px solid var(--gray-a3)' }}
                >
                  <Flex justify="between" align="center">
                    <Flex align="center" gap="4" px="2">
                      <Button variant="ghost">
                        <NextLink href="/">Home</NextLink>
                      </Button>

                      <Button variant="ghost">
                        <NextLink href="/milestone">Milestone</NextLink>
                      </Button>

                      <Button variant="ghost">
                        <NextLink href="/analytics">
                          Analytics
                          <Badge color="red">new</Badge>
                        </NextLink>
                      </Button>
                    </Flex>

                    <Flex gap="2" align="center" justify="end">
                      <AdenaAddress />

                      <GithubLink>
                        <Button variant="soft">
                          <LinkNone2Icon />
                          Link Github Account
                        </Button>
                      </GithubLink>

                      <ThemeSwitch />
                    </Flex>
                  </Flex>
                </Box>

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
