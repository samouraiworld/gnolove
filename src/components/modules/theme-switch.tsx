'use client';

import { useTheme } from 'next-themes';

import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { IconButton, Spinner } from '@radix-ui/themes';
import { useEffect, useState } from 'react';

const ThemeSwitch = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const onClick = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <IconButton>
        <Spinner />
      </IconButton>
    );
  }

  return (
    <IconButton onClick={onClick}>
      {resolvedTheme === 'light' ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  );
};

export default ThemeSwitch;
