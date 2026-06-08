'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Phone, Wine as WineIcon, ArrowRight, Info, Database, Loader2 } from 'lucide-react';
import { WineCard } from '@/components/catalog/WineCard';
import { FilterBar } from '@/components/catalog/FilterBar';
import { FloatingClientOrderButton } from '@/components/catalog/FloatingClientOrderButton';
import { WineDetailsModal } from '@/components/catalog/WineDetailsModal';
import { useFilteredWines, deriveFilterOptions } from '@/hooks/useFilteredWines';
import { EMPTY_FILTERS, type Wine, type WineFilters } from '@/types/wine';
import { fetchRegionalPricesAction } from '@/app/actions/prices';

const ESTADOS_UF = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function ClientCatalogClient({ initialWines }: { initialWines: Wine[] }) {
  const [filters, setFilters] = useState<WineFilters>(EMPTY_FILTERS);
  const [activeDetailsWine, setActiveDetailsWine] = useState<Wine | null>(null);
  
  // Controle de vinhos com preços regionais aplicados
  const [winesWithRegionalPrices, setWinesWithRegionalPrices] = useState<Wine[]>(initialWines);
  const [loadingPrices, setLoadingPrices] = useState(false);
  
  const filtered = useFilteredWines(winesWithRegionalPrices, filters);
  const { paises, uvas } = deriveFilterOptions(initialWines);

  // Estado da região selecionada
  const [selectedUf, setSelectedUf] = useState('');

  const searchParams = useSearchParams();

  // Carrega a UF salva anteriormente e trata parâmetros do link do representante
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUf = localStorage.getItem('allvino_client_uf');
      if (storedUf) {
        setSelectedUf(storedUf);
      }

      // Capturar representante do link (?repName=...&repPhone=...)
      const repName = searchParams.get('repName');
      const repPhone = searchParams.get('repPhone');

      if (repName) {
        localStorage.setItem('allvino_client_rep_name', repName);
      }
      if (repPhone) {
        // Garantir que salvamos apenas os dígitos do WhatsApp do representante
        const cleanRepPhone = repPhone.replace(/\D/g, '');
        localStorage.setItem('allvino_client_rep_phone', cleanRepPhone);
      }
    }
  }, [searchParams]);

  // Efeito para buscar preços regionais e fazer merge se houver UF e não for "OUTRO"
  useEffect(() => {
    if (selectedUf && selectedUf !== 'OUTRO') {
      const loadRegionalPrices = async () => {
        setLoadingPrices(true);
        try {
          const res = await fetchRegionalPricesAction(selectedUf);
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
          console.error('Erro ao buscar preços regionais:', err);
          setWinesWithRegionalPrices(initialWines);
        } finally {
          setLoadingPrices(false);
        }
      };
      loadRegionalPrices();
    } else {
      setWinesWithRegionalPrices(initialWines);
    }
  }, [selectedUf, initialWines]);

  return (
    <div className="space-y-6 pb-32">
      {/* Seletor regional de Estado (UF) para o cliente ver preços */}
      <div className="bg-stone-850 border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-900/10 border border-gold-900/30 flex items-center justify-center text-gold-500 flex-shrink-0">
            {loadingPrices ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Database size={15} />
            )}
          </div>
          <div>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Tabela de Preço</p>
            <p className="text-xs text-stone-200 font-sans">
              Selecione seu estado (UF) para visualizar as condições e preços regionalizados.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Estado (UF):</span>
            <select
              value={selectedUf}
              onChange={(e) => {
                setSelectedUf(e.target.value);
                localStorage.setItem('allvino_client_uf', e.target.value);
              }}
              className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-gold-500 font-bold focus:outline-none focus:border-gold-500 cursor-pointer appearance-none min-w-[120px]"
            >
              <option value="" className="bg-stone-900 text-stone-200">Preço Nacional</option>
              {ESTADOS_UF.map((uf) => (
                <option key={uf} value={uf} className="bg-stone-900 text-stone-200">{uf}</option>
              ))}
              <option value="OUTRO" className="bg-stone-900 text-gold-500 font-bold">Outro Estado / Central</option>
            </select>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('allvino_client_phone');
              localStorage.removeItem('allvino_client_name');
              localStorage.removeItem('allvino_client_email');
              localStorage.removeItem('allvino_client_uf');
              window.location.reload();
            }}
            className="px-3 py-1.5 border border-stone-800 hover:border-stone-700 hover:bg-stone-900 text-stone-400 hover:text-stone-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200"
          >
            Sair
          </button>
        </div>
      </div>

      {selectedUf === 'OUTRO' && (
        <div className="bg-gold-500/10 border border-gold-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft">
          <div className="space-y-1">
            <h4 className="font-display text-sm font-semibold text-gold-500 uppercase tracking-wider">
              Atendimento Comercial - Outras Regiões
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Você está navegando com a tabela de preço nacional padrão. Para falar com nosso atendimento comercial centralizado:
            </p>
          </div>
          <a
            href="https://wa.me/552732619494"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 font-mono shadow-lift"
          >
            <Phone size={14} />
            Central: 27 3261-9494
          </a>
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

      <FloatingClientOrderButton />

      <WineDetailsModal wine={activeDetailsWine} onClose={() => setActiveDetailsWine(null)} />
    </div>
  );
}
