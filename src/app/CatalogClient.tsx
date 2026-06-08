'use client';

import { useState, useEffect } from 'react';
import { WineCard } from '@/components/catalog/WineCard';
import { FilterBar } from '@/components/catalog/FilterBar';
import { FloatingPdfButton } from '@/components/catalog/FloatingPdfButton';
import { WineDetailsModal } from '@/components/catalog/WineDetailsModal';
import { useFilteredWines, deriveFilterOptions } from '@/hooks/useFilteredWines';
import { EMPTY_FILTERS, type Wine, type WineFilters } from '@/types/wine';
import { createBrowserSupabase } from '@/lib/supabase-client';
import { fetchRegionalPricesAction } from '@/app/actions/prices';
import { Database, Loader2 } from 'lucide-react';

const ESTADOS_UF = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function CatalogClient({ initialWines }: { initialWines: Wine[] }) {
  const [filters, setFilters] = useState<WineFilters>(EMPTY_FILTERS);
  const [activeDetailsWine, setActiveDetailsWine] = useState<Wine | null>(null);

  // States para controle regional
  const [userProfile, setUserProfile] = useState<{ role: string; ufs: string[] } | null>(null);
  const [allowedUfs, setAllowedUfs] = useState<string[]>([]);
  const [previewUf, setPreviewUf] = useState<string>('');
  const [winesWithRegionalPrices, setWinesWithRegionalPrices] = useState<Wine[]>(initialWines);
  const [loadingPrices, setLoadingPrices] = useState(false);

  const filtered = useFilteredWines(winesWithRegionalPrices, filters);
  const { paises, uvas } = deriveFilterOptions(initialWines);

  // 1. Carrega dados do usuário autenticado no carregamento da página
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const supabase = createBrowserSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('admin_users')
            .select('role, ufs')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUserProfile({ role: profile.role, ufs: profile.ufs || [] });
            if (profile.role === 'admin' || profile.role === 'owner') {
              setAllowedUfs(ESTADOS_UF);
              setPreviewUf('SP'); // UF padrão inicial para admin
            } else if (profile.role === 'representante') {
              const ufs = profile.ufs || [];
              setAllowedUfs(ufs);
              if (ufs.length > 0) {
                setPreviewUf(ufs[0]); // UF padrão inicial (primeira dele)
              }
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar perfil regional do representante:', err);
      }
    }
    loadUserProfile();
  }, []);

  // 2. Busca e aplica preços regionais sempre que a UF selecionada muda
  useEffect(() => {
    if (previewUf) {
      const loadRegionalPrices = async () => {
        setLoadingPrices(true);
        try {
          const res = await fetchRegionalPricesAction(previewUf);
          if (res.prices && res.prices.length > 0) {
            const updated = initialWines.map(wine => {
              const regional = res.prices?.find(p => p.wine_id === wine.id);
              if (regional) {
                return {
                  ...wine,
                  preco_atacado: regional.preco_regional // Sobrescreve preco_atacado
                };
              }
              return wine;
            });
            setWinesWithRegionalPrices(updated);
          } else {
            setWinesWithRegionalPrices(initialWines);
          }
        } catch (err) {
          console.error('Erro ao buscar preços regionais para preview:', err);
          setWinesWithRegionalPrices(initialWines);
        } finally {
          setLoadingPrices(false);
        }
      };
      loadRegionalPrices();
    } else {
      setWinesWithRegionalPrices(initialWines);
    }
  }, [previewUf, initialWines]);

  return (
    <div className="space-y-6 pb-32">
      {/* Seletor regional premium exibido apenas para vendedores logados */}
      {allowedUfs.length > 0 && (
        <div className="bg-stone-850 border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-900/10 border border-gold-900/30 flex items-center justify-center text-gold-500">
              {loadingPrices ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Database size={15} />
              )}
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Tabela de Preço Regional</p>
              <p className="text-xs text-stone-200">
                {userProfile?.role === 'representante' 
                  ? 'Exibindo preços das regiões habilitadas para seu acesso.' 
                  : 'Administrador: simulando tabelas de qualquer estado do Brasil.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Simular UF:</span>
              <select
                value={previewUf}
                onChange={(e) => setPreviewUf(e.target.value)}
                className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-gold-500 font-bold focus:outline-none focus:border-gold-500 cursor-pointer appearance-none min-w-[80px]"
              >
                {allowedUfs.map((uf) => (
                  <option key={uf} value={uf} className="bg-stone-900 text-stone-200">{uf}</option>
                ))}
              </select>
            </div>
            <button
              onClick={async () => {
                const supabase = createBrowserSupabase();
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="px-3 py-1.5 border border-stone-800 hover:border-stone-700 hover:bg-stone-900 text-stone-400 hover:text-stone-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200"
            >
              Sair
            </button>
          </div>
        </div>
      )}

      <FilterBar
        filters={filters}
        onChange={setFilters}
        availableCountries={paises}
        availableGrapes={uvas}
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-800 bg-stone-800/40 p-12 text-center text-stone-400">
          Nenhum vinho encontrado com esses filtros.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((w) => (
            <WineCard key={w.id} wine={w} onViewDetails={setActiveDetailsWine} />
          ))}
        </div>
      )}

      <FloatingPdfButton selectedUf={previewUf} allowedUfs={allowedUfs} />

      <WineDetailsModal wine={activeDetailsWine} onClose={() => setActiveDetailsWine(null)} />
    </div>
  );
}
