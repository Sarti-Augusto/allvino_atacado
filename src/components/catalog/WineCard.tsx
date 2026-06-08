'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check } from 'lucide-react';
import { useSelectionStore } from '@/store/selection-store';
import { cn } from '@/lib/utils/cn';
import type { Wine } from '@/types/wine';

interface WineCardProps {
  wine: Wine;
  onViewDetails?: (wine: Wine) => void;
}

const BRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function WineCard({ wine, onViewDetails }: WineCardProps) {
  const { toggle, isSelected } = useSelectionStore();
  const checked = isSelected(wine.id);
  const pathname = usePathname();
  const isClientMode = pathname?.startsWith('/cliente');
  const detailUrl = isClientMode ? `/vinho/${wine.id}?mode=cliente` : `/vinho/${wine.id}`;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-stone-800 shadow-soft transition duration-300',
        'hover:shadow-lift hover:-translate-y-0.5',
        checked ? 'border-allvino-500 ring-2 ring-allvino-900/50' : 'border-stone-800 hover:border-stone-700',
      )}
    >
      <label
        className={cn(
          'absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 transition duration-200',
          checked
            ? 'border-allvino-500 bg-allvino-500 text-white'
            : 'border-stone-700 bg-stone-900/90 text-transparent hover:border-gold-500',
        )}
        title="Selecionar para o catálogo PDF"
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={() =>
            toggle({
              id: wine.id,
              sku: wine.sku,
              nome: wine.nome,
              produtor: wine.produtor,
              pais: wine.pais,
              tipo: wine.tipo,
              safra: wine.safra,
              preco_atacado: wine.preco_atacado,
              imagem_url: wine.imagem_url,
              ficha_tecnica_detalhada: wine.ficha_tecnica_detalhada,
              uva_varietal: wine.uva_varietal,
              caixa_fechada_qnt: wine.caixa_fechada_qnt,
              regiao: wine.regiao,
            })
          }
        />
        <Check className="h-4 w-4" strokeWidth={3} />
      </label>

      <Link
        href={detailUrl}
        className="flex flex-1 flex-col"
        onClick={(e) => {
          if (onViewDetails) {
            e.preventDefault();
            onViewDetails(wine);
          }
        }}
      >
        <div className="relative aspect-[3/4] w-full bg-stone-900/60 border-b border-stone-800/60 flex items-center justify-center overflow-hidden">
          {wine.imagem_url ? (
            <Image
              src={wine.imagem_url}
              alt={wine.nome}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-2 transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-500">
              Sem imagem
            </div>
          )}
          {wine.destaque && (
            <span className="absolute left-3 top-3 rounded-full bg-allvino-500/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-display-wide text-white shadow">
              Destaque
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4 bg-stone-800">
          <h3 className="line-clamp-1 font-display text-sm sm:text-base md:text-lg font-medium text-stone-50 group-hover:text-gold-400 transition duration-200">
            {wine.nome}
          </h3>
          <p className="line-clamp-1 text-[10px] sm:text-xs uppercase tracking-display-wide text-stone-400 font-medium">
            {wine.produtor}
          </p>
          <p className="line-clamp-1 text-[11px] sm:text-xs text-stone-400">
            {wine.pais} {wine.regiao ? ` - ${wine.regiao}` : ''}
          </p>
          <div className="mt-auto flex flex-wrap items-baseline justify-between border-t border-stone-700 pt-2.5 gap-x-2 gap-y-1">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-display-wide text-stone-500">
              {wine.tipo} {wine.safra ? ` - ${wine.safra}` : ''}
            </span>
            <span className="font-display text-sm sm:text-base md:text-lg font-semibold text-gold-400">
              {BRL(wine.preco_atacado)}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
