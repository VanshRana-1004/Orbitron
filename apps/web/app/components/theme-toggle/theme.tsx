'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Moon from '../icons/moon';
import Sun from '../icons/sun';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className='h-auto w-auto flex gap-2 items-center cursor-pointer' onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <Sun /> : <Moon />}
      {theme==='dark' ? <p className='font-inter font-semibold text-white'>Light</p> : <p className='font-inter font-semibold text-[#16422E]'>Dark</p>}  
    </div>

    
  );
}
