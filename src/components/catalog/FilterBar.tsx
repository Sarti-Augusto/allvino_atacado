'use client';

import { useState } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { WINE_TYPES, type WineFilters, type WineType } from '@/types/wine';

interface FilterBarProps {
  filters: WineFilters;
  onChange: (next: WineFilters) => void;
  availableCountries: string[];
  availableGrapes: string[];
}

export function FilterBar({
  filters,
  onChange,
  availableCountries,
  availableGrapes,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleTipo = (t: WineType) => {
    const next = filters.tipos.includes(t)
      ? filters.tipos.filter((x) => x !== t)
      : [...filters.tipos, t];
    onChange({ ...filters, tipos: next });
  };

  const togglePais = (p: string) => {
    const next = filters.paises.includes(p)
      ? filters.paises.filter((x) => x !== p)
      : [...filters.paises, p];
    onChange({ ...filters, paises: next });
  };

  const activeCount =
    filters.tipos.length +
    filters.paises.length +
    filters.uvas.length +
    (filters.precoMin ? 1 : 0) +
    (filters.precoMax ? 1 : 0);

  return (
    <div className="space-y-3 rounded-xl border border-stone-800 bg-stone-800/80 p-4 shadow-soft">
      {/* Busca textual */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
        <input
          type="search"
          placeholder="Buscar por nome, produtor, uva, região..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full rounded-lg border border-stone-700 bg-stone-900 py-2.5 pl-10 pr-3 text-sm text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition duration-200"
        />
      </div>

      {/* Faixa de preco e Ordenação */}
      <div className="flex flex-wrap items-center gap-3 border-t border-stone-850 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-stone-400">Preço Mín</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={filters.precoMin ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                precoMin: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-20 rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-200 focus:border-gold-500 focus:outline-none transition"
            placeholder="Min"
          />
          <span className="text-stone-600">-</span>
          <span className="text-[10px] uppercase font-bold text-stone-400">Máx</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={filters.precoMax ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                precoMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-20 rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-200 focus:border-gold-500 focus:outline-none transition"
            placeholder="Max"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort-by" className="text-[10px] uppercase font-bold text-stone-400">Ordenar por</label>
          <select
            id="sort-by"
            value={filters.sortBy || 'destaque'}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value as any })}
            className="rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-300 focus:border-gold-500 focus:outline-none transition-all cursor-pointer font-medium hover:border-gold-500/40"
          >
            <option value="destaque">Destaques Allvino</option>
            <option value="preco_asc">Preço: Menor para Maior</option>
            <option value="preco_desc">Preço: Maior para Menor</option>
            <option value="nome_asc">Nome: A-Z</option>
            <option value="nome_desc">Nome: Z-A</option>
          </select>
        </div>

        {/* Botão de Expandir Filtros de Categoria e País */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
            isExpanded
              ? 'border-gold-500 bg-gold-500/10 text-gold-400 shadow-lift'
              : 'border-stone-700 bg-stone-900 text-stone-300 hover:border-gold-500/40'
          }`}
        >
          <span>Categorias & Países</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() =>
              onChange({
                search: '',
                tipos: [],
                paises: [],
                uvas: [],
                precoMin: undefined,
                precoMax: undefined,
                sortBy: 'destaque',
              })
            }
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-gold-500 hover:bg-stone-900 hover:text-gold-400 transition"
          >
            <X className="h-3 w-3" />
            Limpar ({activeCount})
          </button>
        )}
      </div>

      {/* Menu suspenso expansível de filtros */}
      {isExpanded && (
        <div className="space-y-4 border-t border-stone-850 pt-3 animate-fade-in">
          {/* Tipos de vinho */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Categorias (Tipo de Vinho)
            </p>
            <div className="flex flex-wrap gap-2">
              {WINE_TYPES.map((t) => {
                const active = filters.tipos.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTipo(t)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition duration-200 ${
                      active
                        ? 'border-allvino-500 bg-allvino-500 text-white shadow-md'
                        : 'border-stone-700 bg-stone-900 text-stone-300 hover:border-gold-500/40'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Países */}
          {availableCountries.length > 0 && (
            <div className="border-t border-stone-850/50 pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Países
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableCountries.map((p) => {
                  const active = filters.paises.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePais(p)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition duration-200 ${
                        active
                          ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                          : 'border-stone-700 bg-stone-900 text-stone-300 hover:border-gold-500/30'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
