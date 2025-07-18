export const MENU_ITEMS = [
  {
    label: 'Home',
    href: '/',
    new: false,
  },
  {
    label: 'Teams',
    href: '/teams',
    new: true,
  },
  {
    label: 'Milestone',
    href: '/milestone',
    new: false,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    new: false,
  },
  {
    label: 'Tutorials',
    href: '/tutorials',
    new: true,
  },
] as const satisfies ReadonlyArray<{ label: string; href: string; new: boolean }>;