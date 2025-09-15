import { ReactNode, Suspense } from 'react';

import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from 'next-themes';

import '@/styles/globals.css';

import OfflineBanner from '@/elements/offline-banner';

import AdenaProvider from '@/contexts/adena-context';
import { OfflineProvider } from '@/contexts/offline-context';

import QueryClientWrapper from '@/wrappers/query-client';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/modules/app-sidebar';
import { Header } from '@/modules/header';

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
                  <SidebarProvider>
                    <Suspense fallback={null}>
                      <AppSidebar />
                    </Suspense>
                    <SidebarInset>
                      <Suspense fallback={null}>
                        <Header />
                      </Suspense>
                      {children}
                      {details}
                    </SidebarInset>
                  </SidebarProvider>
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
