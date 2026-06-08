'use client';

import { useState, useEffect } from 'react';
import { CatalogClient } from './CatalogClient';
import { ClientCatalogClient } from './cliente/ClientCatalogClient';
import { createBrowserSupabase } from '@/lib/supabase-client';
import { Loader2 } from 'lucide-react';
import type { Wine } from '@/types/wine';

export function HomeCatalogWrapper({ initialWines }: { initialWines: Wine[] }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createBrowserSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Erro ao verificar sessão do representante:', err);
      } finally {
        setAuthChecked(true);
      }
    }
    checkSession();
  }, []);

  if (!authChecked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
        <Loader2 className="animate-spin text-gold-500" size={24} />
        <p className="text-xs uppercase tracking-wider font-bold">Carregando catálogo...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    // Usuário logado (Admin ou Representante) -> Acesso ao catálogo do representante
    return <CatalogClient initialWines={initialWines} />;
  }

  // Usuário comum / cliente -> Acesso ao catálogo do cliente (exige telefone, nome e e-mail)
  return <ClientCatalogClient initialWines={initialWines} />;
}
