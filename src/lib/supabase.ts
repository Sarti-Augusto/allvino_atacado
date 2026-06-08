// =====================================================================
// Cliente Supabase (browser + server)
// =====================================================================
import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Para componentes Client (use no front do catalogo)
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Para chamadas no servidor públicas (evita erro de cookies dinâmicos em builds estáticos/ISR)
export function createPublicServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Para Server Components, Route Handlers e Server Actions
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch { /* RSC */ }
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch { /* RSC */ }
        },
      },
    },
  );
}

// Retorna as configurações de conexão Postgres de forma dinâmica baseada na URL do projeto
export function getDbConfig() {
  const defaultHost = 'db.jlucrpzpacmlnmqfdana.supabase.co';
  let host = process.env.SUPABASE_DB_HOST || defaultHost;
  
  if (!process.env.SUPABASE_DB_HOST && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
      const parts = url.hostname.split('.');
      if (parts.length > 0 && parts[0]) {
        // Ex: jlucrpzpacmlnmqfdana.supabase.co -> db.jlucrpzpacmlnmqfdana.supabase.co
        host = `db.${parts[0]}.supabase.co`;
      }
    } catch (err) {
      console.warn("Falha ao analisar NEXT_PUBLIC_SUPABASE_URL para extrair DB host:", err);
    }
  }

  return {
    user: process.env.SUPABASE_DB_USER || 'postgres',
    host,
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || 'Allvino#b2b',
    port: Number(process.env.SUPABASE_DB_PORT) || 5432,
    ssl: {
      rejectUnauthorized: false
    }
  };
}
