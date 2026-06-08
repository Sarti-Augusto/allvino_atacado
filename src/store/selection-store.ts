// =====================================================================
// Store Zustand - Carrinho de Selecao de Vinhos
// Persiste no localStorage para nao perder a selecao entre telas
// =====================================================================
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SelectedWine } from '@/types/wine';

interface SelectionState {
  selected: Record<string, SelectedWine>;
  count: number;
  total: number;

  toggle:  (wine: SelectedWine) => void;
  add:     (wine: SelectedWine) => void;
  remove:  (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear:   () => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set, get) => ({
      selected: {},
      count: 0,
      total: 0,

      toggle: (wine) => {
        const { selected } = get();
        const next = { ...selected };
        if (next[wine.id]) {
          delete next[wine.id];
        } else {
          next[wine.id] = { ...wine, quantity: 1 };
        }
        set(recalc(next));
      },

      add: (wine) => {
        const next = { ...get().selected };
        if (next[wine.id]) {
          next[wine.id] = { ...next[wine.id], quantity: (next[wine.id].quantity || 1) + 1 };
        } else {
          next[wine.id] = { ...wine, quantity: 1 };
        }
        set(recalc(next));
      },

      remove: (id) => {
        const next = { ...get().selected };
        delete next[id];
        set(recalc(next));
      },

      updateQuantity: (id, quantity) => {
        const { selected } = get();
        if (!selected[id]) return;
        const next = { ...selected };
        if (quantity <= 0) {
          delete next[id];
        } else {
          next[id] = { ...next[id], quantity };
        }
        set(recalc(next));
      },

      clear: () => set({ selected: {}, count: 0, total: 0 }),

      isSelected: (id) => Boolean(get().selected[id]),
    }),
    {
      name: 'wine-catalog:selection',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const next = recalc(state.selected);
          state.count = next.count;
          state.total = next.total;
        }
      },
    },
  ),
);

function recalc(selected: Record<string, SelectedWine>) {
  const list = Object.values(selected);
  return {
    selected,
    count: list.length,
    total: list.reduce((acc, w) => acc + w.preco_atacado * (w.quantity || 1), 0),
  };
}
