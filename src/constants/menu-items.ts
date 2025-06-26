export const MENU_ITEMS = [
  {
    label: 'Home',
    href: '/',
    new: false,
  },
  {
    label: 'Milestone',
    href: '/milestone',
    new: false,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    new: true,
  },
  {
    label: 'Tutorials',
    href: '/tutorials',
    new: true,
  },
] as const satisfies ReadonlyArray<{ label: string; href: string; new: boolean }>;