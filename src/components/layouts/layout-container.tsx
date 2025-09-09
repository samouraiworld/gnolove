import { HTMLAttributes } from 'react';

import Footer from '@/modules/footer';

import { cn } from '@/utils/style';

import { ScrollArea } from '@/components/ui/scroll-area';

type Props = HTMLAttributes<HTMLDivElement> & { className?: string };

const LayoutContainer = ({ className, ...props }: Props) => {
  return (
    <div className="min-h-screen w-full pt-8 sm:pt-4 lg:pt-0">
      <ScrollArea>
        <div
          className={cn('mx-auto w-full max-w-7xl min-w-0 space-y-2 overflow-hidden p-2 sm:p-4 lg:p-7', className)}
          {...props}
        />
        <Footer />
      </ScrollArea>
    </div>
  );
};
export default LayoutContainer;
