'use client';

import Image from 'next/image';
import NextLink from 'next/link';

import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import { Badge, Button, Dialog, Flex, IconButton } from '@radix-ui/themes';

import MinecraftHeart from '@/image/minecraft-heart.png';

import Footer from '@/components/modules/footer';

const MobileNavDrawer = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <IconButton variant="ghost" ml="1" className="flex md:hidden">
          <HamburgerMenuIcon width="18" height="18" />
        </IconButton>
      </Dialog.Trigger>

      <Dialog.Content
        className="animate-slide-in-from-left data-[state=open]:animate-slide-in-from-left fixed inset-y-0 left-0 z-50 w-3/4"
        style={{ borderRadius: 0 }}
      >
        <Dialog.Title className="hidden">Navigation menu</Dialog.Title>
        <Flex direction="column" justify="between" height="100%" gap="5">
          <Flex direction="row" justify="between" p="4">
            <Image src={MinecraftHeart} alt="minecraft heart" width={12} height={12} />
          </Flex>

          <Flex flexGrow="1" direction="column" align="start" gap="5" p="4">
            <Dialog.Close>
              <Button size="4" variant="ghost" asChild>
                <NextLink href="/">Home</NextLink>
              </Button>
            </Dialog.Close>

            <Dialog.Close>
              <Button size="4" variant="ghost" asChild>
                <NextLink href="/milestone">Milestone</NextLink>
              </Button>
            </Dialog.Close>

            <Dialog.Close>
              <Button size="4" variant="ghost" asChild>
                <NextLink href="/analytics">
                  Analytics
                  <Badge color="red">new</Badge>
                </NextLink>
              </Button>
            </Dialog.Close>
          </Flex>

          <Footer />
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default MobileNavDrawer;
