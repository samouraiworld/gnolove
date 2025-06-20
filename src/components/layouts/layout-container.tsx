import { Flex, FlexProps, ScrollArea } from '@radix-ui/themes';

import Footer from '@/module/footer';

import { cn } from '@/util/style';

const LayoutContainer = ({ className, ...props }: FlexProps) => {
  return (
    <Flex className="h-screen w-screen" pt={{ initial: '8', sm: '4', lg: '0' }} asChild>
      <ScrollArea>
        <Flex
          p={{ initial: '2', sm: '4', lg: '7' }}
          gap="2"
          direction="column"
          className={cn('max-w-screen mx-auto w-full min-w-0 max-w-7xl overflow-hidden', className)}
          {...props}
        />

        <Footer />
      </ScrollArea>
    </Flex>
  );
};
export default LayoutContainer;
