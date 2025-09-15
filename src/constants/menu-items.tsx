import { Home, BarChart3, FileText, Users, Target, User, Vote, PlayCircle } from 'lucide-react';

export const MENU_ITEMS = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Reports',
    href: '/report',
    icon: FileText,
  },
  {
    name: 'Teams',
    href: '/teams',
    icon: Users,
  },
  {
    name: 'Milestone',
    href: '/milestone',
    icon: Target,
  },
  {
    name: 'Contributors',
    href: '/contributors',
    icon: User,
  },
  {
    name: 'GovDAO',
    href: '/govdao',
    icon: Vote,
  },
  {
    name: 'Tutorials',
    href: '/tutorials',
    icon: PlayCircle,
  },
];