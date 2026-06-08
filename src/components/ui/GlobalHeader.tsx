'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { createBrowserSupabase } from '@/lib/supabase-client';
import { LogOut } from 'lucide-react';

export function GlobalHeader() {
  const pathname = usePathname();
  const [isLogged, setIsLogged] = useState(false);

  // Se for qualquer rota sob /admin, não renderiza o cabeçalho global
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdminRoute) return;

    async function checkAuth() {
      // 1. Verificar se há dados de cliente no localStorage
      const storedPhone = localStorage.getItem('allvino_client_phone');
      if (storedPhone) {
        setIsLogged(true);
        return;
      }

      // 2. Verificar se há sessão ativa no Supabase
      try {
        const supabase = createBrowserSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        setIsLogged(!!session?.user);
      } catch (err) {
        console.error('Erro ao verificar auth no header:', err);
        setIsLogged(false);
      }
    }

    checkAuth();
    
    // Intervalo de segurança leve para atualizar o estado caso o usuário entre/saia
    const interval = setInterval(checkAuth, 2500);
    return () => clearInterval(interval);
  }, [pathname, isAdminRoute]);

  const handleLogout = async () => {
    // 1. Limpar dados do cliente
    localStorage.removeItem('allvino_client_phone');
    localStorage.removeItem('allvino_client_name');
    localStorage.removeItem('allvino_client_email');
    localStorage.removeItem('allvino_client_uf');

    // 2. Deslogar do Supabase Auth
    try {
      const supabase = createBrowserSupabase();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao deslogar:', err);
    }

    // 3. Recarregar para a home limpa
    window.location.href = '/';
  };

  if (isAdminRoute) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-stone-800 bg-stone-900/95 backdrop-blur supports-[backdrop-filter]:bg-stone-900/75">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="/" className="flex items-center gap-2">
          <Logo variant="light" className="logo-light" width={120} height={40} priority />
          <Logo variant="dark" className="logo-dark" width={120} height={40} priority />
        </a>
        <div className="flex items-center gap-3">
          <span className="hidden text-[10px] font-medium uppercase tracking-display-wide text-gold-500 md:inline">
            Catálogo Atacado B2B
          </span>
          <ThemeToggle />
          
          {isLogged && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-800 hover:border-stone-700 bg-stone-950/60 hover:bg-stone-900/90 text-stone-400 hover:text-stone-200 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer"
              title="Sair do portal"
            >
              <LogOut size={13} className="text-stone-500 group-hover:text-stone-300" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
