import '@/styles/globals.css';
import { ReactNode } from 'react';
import type { Metadata } from 'next';

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
import AuthProvider from '@/contexts/auth-provider';

// Site-wide SEO metadata
export const metadata: Metadata = {
  // Core
  metadataBase: new URL('https://gnolove.world'),
  applicationName: 'Gnolove',
  title: {
    default: 'Gnolove',
    template: 'Gnolove — %s',
  },
  description:
    'Gnolove is a scoreboard for the Gno chain that showcases contributors, open‑source repositories, and activity across the Gnoland ecosystem.',
  keywords: [
    'Gnolove',
    'Gno',
    'Gnoland',
    'Gno chain',
    'Cosmos',
    'contributors',
    'open source',
    'scoreboard',
    'developer activity',
    'leaderboard',
  ],
  authors: [{ name: 'Samourai Coop' }],
  creator: 'Samourai Coop',
  publisher: 'Samourai Coop',

  // Open Graph
  openGraph: {
    locale: 'en_US',
    type: 'website',
    url: 'https://gnolove.world',
    siteName: 'Gnolove',
    title: 'Gnolove — Gno Chain Contributors Scoreboard',
    description:
      'Explore contributors, repositories, and activity across the Gno chain. Discover top gnomes, trending repos, and community milestones.',
    images: [
      {
        url: '/images/header.png',
        width: 1200,
        height: 630,
        alt: 'Gnolove — Gno Chain Contributors Scoreboard',
      },
    ],
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Gnolove — Gno Chain Contributors Scoreboard',
    description:
      'Scoreboard of contributors, open‑source repositories and activity related to the Gno chain.',
    images: ['/images/header.png'],
  },

  // Robots & indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Icons and manifest
  icons: {
    icon: [
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon-32x32.png'],
  },
  manifest: '/site.webmanifest',

  // Canonicals
  alternates: {
    canonical: 'https://gnolove.world',
  },
};

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
        <AuthProvider>
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
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
