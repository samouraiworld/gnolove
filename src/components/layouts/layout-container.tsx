import { HTMLAttributes } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

import Footer from '@/modules/footer';

import { cn } from '@/utils/style';

type Props = HTMLAttributes<HTMLDivElement> & { className?: string };

const LayoutContainer = ({ className, ...props }: Props) => {
  return (
    <div className="h-screen w-screen pt-8 sm:pt-4 lg:pt-0">
      <ScrollArea>
        <div
          className={cn('mx-auto w-full min-w-0 max-w-7xl overflow-hidden p-2 sm:p-4 lg:p-7 space-y-2', className)}
          {...props}
        />
        <Footer />
      </ScrollArea>
    </div>
  );
};
export default LayoutContainer;
