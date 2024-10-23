'use client';

import { useTheme } from 'next-themes';

import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { Flex, IconButton } from '@radix-ui/themes';

const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();

  const onClick = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Flex position="fixed" top="4" right="4" className="z-50">
      <IconButton onClick={onClick} suppressHydrationWarning>
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </IconButton>
    </Flex>
  );
};

export default ThemeSwitch;
