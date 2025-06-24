'use client';

import Image from 'next/image';
import Link from 'next/link';

import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import { Button, Flex, IconButton, Badge, Theme } from '@radix-ui/themes';
import { Drawer } from 'vaul';

import MinecraftHeart from '@/image/minecraft-heart.png';

import Footer from '@/components/modules/footer';

const MobileNavDrawer = () => {
  return (
    <div className="md:hidden">
      <Drawer.Root direction="left">
        <Drawer.Trigger asChild>
          <IconButton variant="ghost" ml="1" className="flex">
            <HamburgerMenuIcon width="18" height="18" />
          </IconButton>
        </Drawer.Trigger>

        <Drawer.Portal>
          <Theme className="h-full">
            <Drawer.Overlay className="fixed inset-0 z-[100] bg-[rgba(0,0,0,0.4)]" />

            <Drawer.Content className="radix-panel-bg fixed inset-y-0 left-0 z-[101] w-3/4 overflow-y-auto p-8 pb-4">
              <Drawer.Title className="sr-only">Mobile Navigation</Drawer.Title>
              <Drawer.Description className="sr-only">Use this drawer to navigate through the site.</Drawer.Description>

              <Flex direction="column" justify="between" height="100%" gap="5">
                <Flex direction="row" justify="between">
                  <Image src={MinecraftHeart} alt="minecraft heart" width={20} height={20} />
                </Flex>

                <Flex direction="column" align="start" gap="6" mt="8" flexGrow="1">
                  <Drawer.Close asChild>
                    <Button variant="ghost" size="4" asChild>
                      <Link href="/">Home</Link>
                    </Button>
                  </Drawer.Close>

                  <Drawer.Close asChild>
                    <Button variant="ghost" size="4" asChild>
                      <Link href="/milestone">Milestone</Link>
                    </Button>
                  </Drawer.Close>

                  <Drawer.Close asChild>
                    <Button variant="ghost" size="4" asChild>
                      <Link href="/analytics">
                        Analytics <Badge color="red">new</Badge>
                      </Link>
                    </Button>
                  </Drawer.Close>
                </Flex>

                <Footer />
              </Flex>
            </Drawer.Content>
          </Theme>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

export default MobileNavDrawer;
