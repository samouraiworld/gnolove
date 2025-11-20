interface MenuItem {
  label: string;
  href: string;
  new: boolean;
  subItems?: MenuItem[];
}

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
    label: 'Analytics',
    href: '/analytics',
    new: false,
  },
  {
    label: 'Gnoland',
    href: '',
    new: false,
    subItems: [
      {
        label: 'Milestone',
        href: '/milestone',
        new: false,
      },
      {
        label: 'GovDAO',
        href: '/govdao',
        new: false,
      },
      {
        label: 'Validators',
        href: '/validators',
        new: false,
      },
      {
        label: 'Tutorials',
        href: '/tutorials',
        new: false,
      },
      {
        label: 'Settings',
        href: '/settings',
        new: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MenuItem>;
