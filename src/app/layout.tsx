import '@/styles/globals.css';
import { ReactNode } from 'react';

import { ThemeProvider } from 'next-themes';

import { Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import ThemeSwitch from '@/modules/theme-switch';
import { Toaster } from '@/components/ui/sonner';

import { AdenaAddress } from '@/modules/adena-address';
import { GithubLink } from '@/modules/github-link';
import AdenaProvider from '@/contexts/adena-context';
import QueryClientWrapper from '@/wrappers/query-client';
import MobileNavDrawer from '@/modules/mobile-nav-drawer';
import NavHeader from '@/modules/nav-header';

import { Analytics } from '@vercel/analytics/next';

import { OfflineProvider } from '@/contexts/offline-context';
import OfflineBanner from '@/elements/offline-banner';
import { TooltipProvider } from '@/components/ui/tooltip';

interface RootLayoutProps {
  children: ReactNode;
  details: ReactNode;
}

const RootLayout = ({ children, details }: RootLayoutProps) => {
  return (
    <html lang="en" suppressHydrationWarning>
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
              <TooltipProvider>
                <AdenaProvider>
                  <div className="fixed top-0 left-0 w-full p-2 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                    <div className="flex items-center justify-between">
                      <MobileNavDrawer />
                      <NavHeader />
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden items-center gap-2">
                          <AdenaAddress />

                          <GithubLink>
                            <Button variant="secondary" size="sm" className="gap-2">
                              <Link2 className="h-4 w-4" />
                              Link Github Account
                            </Button>
                          </GithubLink>
                        </div>

                        <ThemeSwitch />
                      </div>
                    </div>
                  </div>

                  {children}

                  {details}
                </AdenaProvider>
              </TooltipProvider>
              <Toaster />
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
