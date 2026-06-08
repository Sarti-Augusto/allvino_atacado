'use client';

import Image from 'next/image';
import { X, Check } from 'lucide-react';
import { useSelectionStore } from '@/store/selection-store';
import type { Wine } from '@/types/wine';

interface WineDetailsModalProps {
  wine: Wine | null;
  onClose: () => void;
}

const BRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function WineDetailsModal({ wine, onClose }: WineDetailsModalProps) {
  const { toggle, isSelected } = useSelectionStore();

  if (!wine) return null;

  const checked = isSelected(wine.id);

  const handleToggle = () => {
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
      regiao: wine.regiao,
      caixa_fechada_qnt: wine.caixa_fechada_qnt,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm transition-opacity duration-300">
      {/* Background click listener */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-stone-700 bg-stone-800 shadow-2xl md:flex-row animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button top-right (absolute for floating above image or content) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/80 text-stone-400 border border-stone-700 backdrop-blur-sm hover:text-stone-100 hover:border-stone-600 transition"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left: Image Container (flexible sizing, takes full height on md screens, responsive height on mobile) */}
        <div className="relative h-44 sm:h-56 md:h-full w-full md:w-1/2 bg-stone-900 flex items-center justify-center overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-stone-700/40">
          {wine.imagem_url ? (
            <Image
              src={wine.imagem_url}
              alt={wine.nome}
              fill
              priority
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-500 font-medium">
              Sem imagem
            </div>
          )}
          {wine.destaque && (
            <span className="absolute left-4 top-4 rounded-full bg-allvino-500/95 px-3 py-1.5 text-xs font-bold uppercase tracking-display-wide text-white shadow-lg">
              Destaque
            </span>
          )}
        </div>

        {/* Right: Info Content (scrollable if content overflows) */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Scrollable details area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-stone-700">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-500">
                {wine.tipo} {wine.safra ? `- Safra ${wine.safra}` : ''}
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-stone-50 md:text-3xl leading-tight">
                {wine.nome}
              </h2>
              <p className="mt-1.5 text-sm md:text-base text-stone-400">
                {wine.produtor} • {wine.pais} {wine.regiao ? `(${wine.regiao})` : ''}
              </p>
            </div>

            {/* Price Box */}
            <div className="my-5 rounded-xl border border-stone-700 bg-stone-900 p-4 shadow-soft">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Preço Unitário
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-3xl font-bold text-gold-400">
                  {BRL(wine.preco_atacado)}
                </span>
                <span className="text-xs text-stone-400">
                  / garrafa
                </span>
              </div>
              <p className="mt-1 text-[11px] text-stone-400 font-medium">
                Caixa fechada com {wine.caixa_fechada_qnt} garrafas
              </p>
            </div>

            {/* Technical Details Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 border-b border-stone-700 pb-2">
                Ficha Técnica
              </h3>
              <dl className="mt-2.5 grid grid-cols-2 gap-y-2.5 text-xs md:text-sm">
                <dt className="text-stone-400 font-medium">Uva / Varietal</dt>
                <dd className="text-stone-100 text-right md:text-left">{wine.uva_varietal ?? '-'}</dd>
                
                <dt className="text-stone-400 font-medium">País / Região</dt>
                <dd className="text-stone-100 text-right md:text-left">
                  {wine.pais} {wine.regiao ? `/ ${wine.regiao}` : ''}
                </dd>
                
                <dt className="text-stone-400 font-medium">Safra</dt>
                <dd className="text-stone-100 text-right md:text-left">{wine.safra ?? '-'}</dd>
                
                <dt className="text-stone-400 font-medium">Teor Alcoólico</dt>
                <dd className="text-stone-100 text-right md:text-left">
                  {wine.graduacao_alcoolica ? `${wine.graduacao_alcoolica.toFixed(2)}%` : '-'}
                </dd>
              </dl>
            </div>

            {/* Detailed Description */}
            {wine.ficha_tecnica_detalhada && (
              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 border-b border-stone-700 pb-2 mb-2">
                  Sobre este vinho
                </h3>
                <p className="text-xs md:text-sm leading-relaxed text-stone-400 font-light">
                  {wine.ficha_tecnica_detalhada}
                </p>
              </div>
            )}
          </div>

          {/* Footer Action: Fixed Select/Deselect button */}
          <div className="border-t border-stone-700 bg-stone-900 p-4 md:px-8">
            <button
              onClick={handleToggle}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs md:text-sm font-semibold transition duration-250 shadow-md ${
                checked
                  ? 'bg-stone-700 text-stone-100 hover:bg-stone-600'
                  : 'bg-allvino-500 text-white hover:bg-allvino-600 active:scale-[0.98]'
              }`}
            >
              {checked ? (
                <>
                  <X className="h-4.5 w-4.5" />
                  Remover da Seleção
                </>
              ) : (
                <>
                  <Check className="h-4.5 w-4.5" strokeWidth={3} />
                  Adicionar à Seleção
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
