'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { Button } from './Button';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-10 h-10 rounded-full p-0">
      {theme === 'dark' ? <Sun className="w-5 h-5 text-accent-gold" /> : <Moon className="w-5 h-5 text-accent-blue" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
