// =====================================================================
// Hook: useFilteredWines
// Recebe a lista completa + filtros e retorna a lista ja filtrada
// =====================================================================
'use client';

import { useMemo } from 'react';
import type { Wine, WineFilters } from '@/types/wine';

export function useFilteredWines(wines: Wine[], filters: WineFilters): Wine[] {
  return useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    
    // 1. Filtragem
    const result = wines.filter((w) => {
      if (filters.tipos.length && !filters.tipos.includes(w.tipo)) return false;
      if (filters.paises.length && !filters.paises.includes(w.pais)) return false;
      if (
        filters.uvas.length &&
        (!w.uva_varietal || !filters.uvas.some((u) => w.uva_varietal!.toLowerCase().includes(u.toLowerCase())))
      ) return false;
      if (filters.precoMin !== undefined && w.preco_atacado < filters.precoMin) return false;
      if (filters.precoMax !== undefined && w.preco_atacado > filters.precoMax) return false;

      if (search) {
        const haystack = `${w.nome} ${w.produtor} ${w.uva_varietal ?? ''} ${w.regiao ?? ''}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    // 2. Ordenação
    if (filters.sortBy) {
      result.sort((a, b) => {
        switch (filters.sortBy) {
          case 'preco_asc':
            return a.preco_atacado - b.preco_atacado;
          case 'preco_desc':
            return b.preco_atacado - a.preco_atacado;
          case 'nome_asc':
            return a.nome.localeCompare(b.nome, 'pt-BR');
          case 'nome_desc':
            return b.nome.localeCompare(a.nome, 'pt-BR');
          case 'destaque':
          default:
            // Custom ordering: featured first, then ordered by manual order index `ordem` (ascending)
            if (a.destaque !== b.destaque) {
              return a.destaque ? -1 : 1;
            }
            return a.ordem - b.ordem;
        }
      });
    }

    return result;
  }, [wines, filters]);
}

// Helper: deriva os valores unicos para popular os filtros
export function deriveFilterOptions(wines: Wine[]) {
  const paises = new Set<string>();
  const uvas = new Set<string>();
  for (const w of wines) {
    paises.add(w.pais);
    if (w.uva_varietal) uvas.add(w.uva_varietal);
  }
  return {
    paises: Array.from(paises).sort(),
    uvas: Array.from(uvas).sort(),
  };
}
