import NextLink from 'next/link';

import { MessageCircle, Github, Twitter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { HTMLAttributes } from 'react';

import { cn } from '@/utils/style';

type Props = HTMLAttributes<HTMLDivElement> & { className?: string };

const Footer = ({ className, ...props }: Props) => {
  return (
    <div className={cn('flex flex-col items-center gap-1', className)} {...props}>
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Join the Gno.land Ecosystem!</p>
        <div className="flex gap-4">
          <NextLink href="https://x.com/_gnoland" target="_blank">
            <Button variant="ghost" size="icon" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </Button>
          </NextLink>
          <NextLink href="https://github.com/gnolang" target="_blank">
            <Button variant="ghost" size="icon" aria-label="GitHub">
              <Github className="h-5 w-5" />
            </Button>
          </NextLink>
          <NextLink href="https://discord.gg/YFtMjWwUN7" target="_blank">
            <Button variant="ghost" size="icon" aria-label="Discord community">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </NextLink>
        </div>
      </div>

      <Separator className="my-2" />

      <div className="flex flex-row flex-wrap justify-center gap-1 sm:gap-5 text-muted-foreground">
        <div className="flex items-center mb-2">
          <p className="text-sm">
            Gnolove.world is cooked with ❤️ by{' '}
            <NextLink className="underline underline-offset-4" href="https://www.samourai.world" target="_blank">
              www.samourai.world
            </NextLink>
          </p>
        </div>
        <div className="flex items-center mb-2">
          <p className="text-sm mr-1">Want to contribute?</p>
          <NextLink className="text-sm underline underline-offset-4" href="https://github.com/samouraiworld/gnolove" target="_blank">
            Contribute on GitHub
          </NextLink>
        </div>
      </div>
    </div>
  );
};

export default Footer;
