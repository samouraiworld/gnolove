'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { HamburgerMenuIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Button, Flex, IconButton, Badge, Theme, Box } from '@radix-ui/themes';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'motion/react';

import MinecraftHeart from '@/images/minecraft-heart.png';

import Footer from '@/components/modules/footer';
import { MENU_ITEMS, MenuItem } from '@/constants/menu-items';
import { useOffline } from '@/contexts/offline-context';
import { cn } from '@/utils/style';

const MobileNavDrawer = () => {
  const { isOffline } = useOffline();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const renderMenuItem = (item: MenuItem) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems.has(item.label);

    if (hasSubItems) {
      return (
        <Box key={item.label} width="100%">
          <Button
            variant="ghost"
            size="4"
            className="w-full justify-start"
            onClick={() => toggleExpanded(item.label)}
            disabled={isOffline}
          >
            <Flex align="center" justify="between" width="100%">
              <Flex align="center" gap="2">
                {item.label}
                {item.new && <Badge color='red'>new</Badge>}
              </Flex>
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <ChevronRightIcon />
              </motion.div>
            </Flex>
          </Button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <Flex ml="4" mt="4" direction="column" gap="4">
                  {item.subItems?.map((subItem: MenuItem, index: number) => (
                    <motion.div
                      key={subItem.label}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.05, ease: "easeOut" }}
                    >
                      <Drawer.Close asChild>
                        <Link
                          className={cn(isOffline && 'pointer-events-none')}
                          href={subItem.href}
                        >
                          <Button variant="ghost" size="3" className="w-full justify-start">
                            <Flex align="center" gap="2">
                              {subItem.label}
                              {subItem.new && <Badge color='red'>new</Badge>}
                            </Flex>
                          </Button>
                        </Link>
                      </Drawer.Close>
                    </motion.div>
                  ))}
                </Flex>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      );
    }

    return (
      <Flex align="center" key={item.href}>
        <Drawer.Close asChild>
          <Link className={cn(isOffline && 'pointer-events-none')} href={item.href}>
            <Button variant="ghost" size="4" className="w-full justify-start">
              <span>
                {item.label}
                {item.new && <Badge color='red'>new</Badge>}
              </span>
            </Button>
          </Link>
        </Drawer.Close>
      </Flex>
    );
  };

  return (
    <Box className="md:hidden">
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

                <Flex direction="column" align="start" justify="center" gap="6" flexGrow="1">
                  {MENU_ITEMS.map(renderMenuItem)}
                </Flex>

                <Footer />
              </Flex>
            </Drawer.Content>
          </Theme>
        </Drawer.Portal>
      </Drawer.Root>
    </Box>
  );
};

export default MobileNavDrawer;
