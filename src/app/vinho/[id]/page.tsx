// =====================================================================
// Pagina do Produto (Ficha Tecnica)
// SSG - revalidate a cada 5min
// =====================================================================
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase';
import { ShareButton } from '@/components/catalog/ShareButton';
import { WineQrCode } from '@/components/catalog/WineQrCode';
import { WineViewTracker } from '@/components/catalog/WineViewTracker';
import { headers } from 'next/headers';

export const revalidate = 300;

const BRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function WinePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const { data: wine, error } = await supabase
    .from('wines')
    .select('*')
    .eq('id', params.id)
    .eq('ativo', true)
    .single();

  if (error || !wine) notFound();

  // Constroi a URL absoluta a partir do Host (para o share funcionar fora do localhost)
  const h = headers();
  const host = h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const productUrl = `${proto}://${host}/vinho/${wine.id}`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <WineViewTracker wineId={wine.id} />
      <nav className="mb-4 text-sm text-stone-500">
        <a href="/" className="hover:text-rose-800">Catalogo</a>
        <span className="mx-2">/</span>
        <span className="text-stone-700">{wine.nome}</span>
      </nav>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        {/* Foto */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-stone-100">
          {wine.imagem_url ? (
            <Image
              src={wine.imagem_url}
              alt={wine.nome}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-400">
              Sem imagem
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-rose-800">
            {wine.tipo} {wine.safra ? `- Safra ${wine.safra}` : ''}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
            {wine.nome}
          </h1>
          <p className="mt-2 text-lg text-stone-600">
            {wine.produtor} - {wine.pais} {wine.regiao ? `- ${wine.regiao}` : ''}
          </p>

          <div className="my-6 rounded-xl bg-stone-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Preco Atacado
            </p>
            <p className="mt-1 font-display text-4xl font-bold text-rose-800">
              {BRL(wine.preco_atacado)}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Caixa fechada com {wine.caixa_fechada_qnt} garrafas
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <ShareButton
              wineName={wine.nome}
              productUrl={productUrl}
            />
            <WineQrCode url={productUrl} />
          </div>

          <h2 className="mt-8 font-semibold text-stone-900">Ficha Tecnica</h2>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-stone-500">Uva</dt>
            <dd className="text-stone-800">{wine.uva_varietal ?? '-'}</dd>
            <dt className="text-stone-500">Pais / Regiao</dt>
            <dd className="text-stone-800">{wine.pais} {wine.regiao ? `/ ${wine.regiao}` : ''}</dd>
            <dt className="text-stone-500">Safra</dt>
            <dd className="text-stone-800">{wine.safra ?? '-'}</dd>
            <dt className="text-stone-500">Graduacao Alcoolica</dt>
            <dd className="text-stone-800">
              {wine.graduacao_alcoolica ? `${wine.graduacao_alcoolica.toFixed(2)}%` : '-'}
            </dd>
          </dl>

          {wine.ficha_tecnica_detalhada && (
            <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
              <p className="text-sm leading-relaxed text-stone-700">
                {wine.ficha_tecnica_detalhada}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
