'use client';

import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function GlobalHeader() {
  const pathname = usePathname();

  // Se for qualquer rota sob /admin, não renderiza o cabeçalho global
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-stone-800 bg-stone-900/95 backdrop-blur supports-[backdrop-filter]:bg-stone-900/75">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="/" className="flex items-center gap-2">
          <Logo variant="light" className="logo-light" width={120} height={40} priority />
          <Logo variant="dark" className="logo-dark" width={120} height={40} priority />
        </a>
        <div className="flex items-center gap-4">
          <span className="hidden text-[10px] font-medium uppercase tracking-display-wide text-gold-500 sm:inline">
            Catálogo Atacado B2B
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
