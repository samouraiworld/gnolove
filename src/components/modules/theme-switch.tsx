'use client';

import { useTheme } from 'next-themes';

import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { IconButton } from '@radix-ui/themes';

const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();

  const onClick = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <IconButton onClick={onClick} suppressHydrationWarning>
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  );
};

export default ThemeSwitch;
