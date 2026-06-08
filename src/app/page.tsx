// =====================================================================
// Pagina inicial - Catalogo de Vinhos
// Server Component com ISR (revalida a cada 60s)
// =====================================================================
import { Suspense } from 'react';
import { fetchWinesServer } from '@/app/actions/wines';
import { HomeCatalogWrapper } from './HomeCatalogWrapper';

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
        <h1 className="mt-1 font-display text-4xl font-medium text-stone-50 sm:text-5xl uppercase tracking-display">
          Nosso Catálogo Digital
        </h1>
      </section>

      <Suspense fallback={<div className="text-stone-400">Carregando catálogo...</div>}>
        <HomeCatalogWrapper initialWines={wines} />
      </Suspense>
    </main>
  );
}
