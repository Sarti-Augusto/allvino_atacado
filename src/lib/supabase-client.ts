// =====================================================================
// Cliente Supabase para o Browser (Client Components)
// Evita importar next/headers para não quebrar no bundler
// =====================================================================
import { createBrowserClient } from '@supabase/ssr';

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
