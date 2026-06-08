'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'clean'>('dark');

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('allvino_theme') as 'dark' | 'clean' | null;
    if (savedTheme === 'clean') {
      setTheme('clean');
      document.documentElement.classList.add('clean');
    } else {
      setTheme('dark');
      document.documentElement.classList.remove('clean');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'clean' : 'dark';
    setTheme(nextTheme);
    
    if (nextTheme === 'clean') {
      document.documentElement.classList.add('clean');
      localStorage.setItem('allvino_theme', 'clean');
    } else {
      document.documentElement.classList.remove('clean');
      localStorage.setItem('allvino_theme', 'dark');
    }
  };

  // Prevent rendering on SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-full border border-stone-800 bg-stone-900/30" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Alternar tema de cores"
      title={theme === 'dark' ? 'Alternar para Modo Clean' : 'Alternar para Modo Escuro'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-700 bg-stone-800/40 text-gold-500 hover:border-gold-500 hover:bg-stone-850 transition duration-200 active:scale-95 shadow-sm"
    >
      {theme === 'dark' ? (
        <Sun className="h-4.5 w-4.5 text-gold-400" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-allvino-500" />
      )}
    </button>
  );
}
