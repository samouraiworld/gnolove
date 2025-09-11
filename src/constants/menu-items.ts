export const MENU_ITEMS = [
  {
    label: 'Home',
    href: '/',
    new: false,
  },
  {
    label: 'Teams',
    href: '/teams',
    new: false,
  },
  {
    label: 'Report',
    href: '/report',
    new: false,
  },
  {
    label: 'Milestone',
    href: '/milestone',
    new: false,
  },
  {
    label: 'GovDAO',
    href: '/govdao',
    new: true,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    new: false,
  },
  {
    label: 'Tutorials',
    href: '/tutorials',
    new: false,
  },
] as const satisfies ReadonlyArray<{ label: string; href: string; new: boolean }>;
