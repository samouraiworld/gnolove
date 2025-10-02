import { Box, BoxProps, Flex, FlexProps, ScrollArea } from '@radix-ui/themes';

import Footer from '@/modules/footer';

import { cn } from '@/utils/style';

import React from 'react';

const LayoutContainer: React.FC<BoxProps & { children: React.ReactNode }> = ({ children, className, ...props }) => {
  return (
    <Box className={cn('min-h-[100dvh] mx-auto w-full min-w-0 max-w-7xl overflow-hidden pb-40', className)} pt="9" asChild>
      <ScrollArea>
        <Box px={{ initial: '1', sm: '4', lg: '7' }} {...props}>
          {children}
        </Box>
        <Footer className="absolute bottom-0 left-0 right-0" />
      </ScrollArea>
    </Box>
  );
};
export default LayoutContainer;
