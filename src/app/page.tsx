// =====================================================================
// Pagina inicial - Catalogo de Vinhos
// Server Component com ISR (revalida a cada 60s)
// =====================================================================
import { Suspense } from 'react';
import { fetchWinesServer } from '@/app/actions/wines';
import { CatalogClient } from './CatalogClient';

export const revalidate = 60;

export default async function HomePage() {
  const { wines, total, error } = await fetchWinesServer();

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-lg border border-allvino-200 bg-allvino-50 p-4 text-allvino-800">
          Erro ao carregar catalogo: {error}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-display-wide text-gold-500">
          Seleção do Mês
        </p>
        <h1 className="mt-1 font-display text-4xl font-medium text-stone-50 sm:text-5xl">
          Nosso Catálogo
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-400 sm:text-base leading-relaxed">
          {total} {total === 1 ? 'rótulo disponível' : 'rótulos disponíveis'} para o atacado.
          Selecione os vinhos que deseja, gere um catálogo PDF personalizado e compartilhe
          direto no WhatsApp.
        </p>
      </section>

      <Suspense fallback={<div className="text-stone-400">Carregando catálogo...</div>}>
        <CatalogClient initialWines={wines} />
      </Suspense>
    </main>
  );
}
