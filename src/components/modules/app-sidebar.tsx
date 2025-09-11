'use client';

import PreservingLink from '@/components/elements/preserving-link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import MinecraftHeart from '@/assets/images/minecraft-heart.png';
import { MENU_ITEMS } from '@/constants/menu-items';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <PreservingLink href="/">
          <div className='flex items-center gap-2 px-2'>
            <Image src={MinecraftHeart} alt='Gnolove' width={24} height={24} />
            <span className='text-lg font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden'>
              Gnolove
            </span>
          </div>
        </PreservingLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <PreservingLink href={item.href}>
                        <item.icon className='h-4 w-4' />
                        <span>{item.name}</span>
                      </PreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
