import { HTMLAttributes } from 'react';

import NextLink from 'next/link';

import { MessageCircle, Github, Twitter } from 'lucide-react';

import { cn } from '@/utils/style';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Props = HTMLAttributes<HTMLDivElement> & { className?: string };

const Footer = ({ className, ...props }: Props) => {
  return (
    <div className={cn('flex flex-col items-center gap-1', className)} {...props}>
      <div className="flex flex-col items-center gap-2">
        <p className="text-muted-foreground text-sm">Join the Gno.land Ecosystem!</p>
        <div className="flex gap-4">
          <Button asChild variant="ghost" size="icon" aria-label="Twitter">
            <NextLink href="https://x.com/_gnoland" target="_blank">
              <Twitter className="h-5 w-5" />
            </NextLink>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="GitHub">
            <NextLink href="https://github.com/gnolang" target="_blank">
              <Github className="h-5 w-5" />
            </NextLink>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Discord community">
            <NextLink href="https://discord.gg/YFtMjWwUN7" target="_blank">
              <MessageCircle className="h-5 w-5" />
            </NextLink>
          </Button>
        </div>
      </div>

      <Separator className="my-2" />

      <div className="text-muted-foreground flex flex-row flex-wrap justify-center gap-1 sm:gap-5">
        <div className="mb-2 flex items-center">
          <p className="text-sm">
            Gnolove.world is cooked with ❤️ by{' '}
            <NextLink className="underline underline-offset-4" href="https://www.samourai.world" target="_blank" rel="noopener noreferrer">
              www.samourai.world
            </NextLink>
          </p>
        </div>
        <div className="mb-2 flex items-center">
          <p className="mr-1 text-sm">Want to contribute?</p>
          <NextLink
            className="text-sm underline underline-offset-4"
            href="https://github.com/samouraiworld/gnolove"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contribute on GitHub
          </NextLink>
        </div>
      </div>
    </div>
  );
};

export default Footer;
