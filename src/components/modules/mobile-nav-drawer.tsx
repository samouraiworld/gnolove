'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Drawer } from 'vaul';

import MinecraftHeart from '@/images/minecraft-heart.png';

import Footer from '@/components/modules/footer';
import { MENU_ITEMS } from '@/constants/menu-items';
import { useOffline } from '@/contexts/offline-context';
import { cn } from '@/utils/style';

const MobileNavDrawer = () => {
  const { isOffline } = useOffline();

  return (
    <div className="md:hidden">
      <Drawer.Root direction="left">
        <Drawer.Trigger asChild>
          <Button variant="ghost" size="icon" className="ml-1">
            <Menu className="h-5 w-5" />
          </Button>
        </Drawer.Trigger>

        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[100] bg-black/40" />

          <Drawer.Content className="fixed inset-y-0 left-0 z-[101] w-3/4 overflow-y-auto bg-background p-8 pb-4">
            <Drawer.Title className="sr-only">Mobile Navigation</Drawer.Title>
            <Drawer.Description className="sr-only">Use this drawer to navigate through the site.</Drawer.Description>

            <div className="flex h-full flex-col justify-between gap-5">
              <div className="flex flex-row justify-between">
                <Image src={MinecraftHeart} alt="minecraft heart" width={20} height={20} />
              </div>

              <div className="mt-8 flex flex-col items-start gap-6 flex-grow">
                {MENU_ITEMS.map((item) => (
                  <Drawer.Close asChild key={item.href}>
                    <Link className={cn(isOffline && 'pointer-events-none')} href={item.href}>
                      <Button variant="ghost" size="lg" asChild>
                        <span>
                          {item.label}
                          {item.new && <Badge className="ml-2" variant="destructive">new</Badge>}
                        </span>
                      </Button>
                    </Link>
                  </Drawer.Close>
                ))}
              </div>

              <Footer />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

export default MobileNavDrawer;
