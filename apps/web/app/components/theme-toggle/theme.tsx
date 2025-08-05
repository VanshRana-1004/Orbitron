'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Moon from '../icons/moon';
import Sun from '../icons/sun';

export function ThemeToggle({text,bg}: { text: boolean,bg: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className={`rounded px-3 py-1 gap-2 font-medium geist-font text-[14px] tracking-tight flex justify-start geist-font ${bg && 'border border-[#7AF8C1] dark:border-[#1E2C40] bg-white dark:bg-[#02060D]'} text-[#16422E] dark:text-white cursor-pointer items-center`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <Sun /> : <Moon />}
      {text && theme==='dark' && <p>Light</p>}
      {text && <p className='dark:hidden'>Dark</p>}
    </div>
  );
}
