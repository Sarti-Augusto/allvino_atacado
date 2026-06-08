'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Phone, Wine as WineIcon, ArrowRight, Info, User, Mail } from 'lucide-react';
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

  // Estados de controle de acesso e região
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputName, setInputName] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputUf, setInputUf] = useState('');
  const [selectedUf, setSelectedUf] = useState('');
  
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [errorAccess, setErrorAccess] = useState('');

  const searchParams = useSearchParams();

  // Carrega e valida sessão do cliente e trata parâmetros do link do representante
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPhone = localStorage.getItem('allvino_client_phone');
      const storedName = localStorage.getItem('allvino_client_name');
      const storedEmail = localStorage.getItem('allvino_client_email');
      const storedUf = localStorage.getItem('allvino_client_uf');
      
      if (storedPhone && storedName && storedEmail) {
        setIsAuthorized(true);
      }
      if (storedPhone) setInputPhone(storedPhone);
      if (storedName) setInputName(storedName);
      if (storedEmail) setInputEmail(storedEmail);
      if (storedUf) {
        setSelectedUf(storedUf);
        setInputUf(storedUf);
      }

      // Capturar representante do link (?repName=...&repPhone=...)
      const repName = searchParams.get('repName');
      const repPhone = searchParams.get('repPhone');

      if (repName) {
        localStorage.setItem('allvino_client_rep_name', repName);
      }
      if (repPhone) {
        // Garantir que salvamos apenas os digitos do WhatsApp do representante
        const cleanRepPhone = repPhone.replace(/\D/g, '');
        localStorage.setItem('allvino_client_rep_phone', cleanRepPhone);
      }
    }
  }, [searchParams]);

  // Efeito para buscar preços regionais e fazer merge se houver UF e não for "OUTRO"
  useEffect(() => {
    if (isAuthorized && selectedUf && selectedUf !== 'OUTRO') {
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
  }, [isAuthorized, selectedUf, initialWines]);

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAccess('');

    if (!inputName.trim()) {
      setErrorAccess('Por favor, informe seu nome.');
      return;
    }

    // Validação simples de telefone
    const cleanPhone = inputPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorAccess('Por favor, insira um número de telefone com DDD válido.');
      return;
    }

    // Validação simples de e-mail
    if (!inputEmail.trim() || !inputEmail.includes('@')) {
      setErrorAccess('Por favor, insira um e-mail válido.');
      return;
    }

    if (!inputUf) {
      setErrorAccess('Por favor, selecione seu Estado (UF).');
      return;
    }

    setLoadingAccess(true);
    try {
      localStorage.setItem('allvino_client_phone', inputPhone);
      localStorage.setItem('allvino_client_name', inputName);
      localStorage.setItem('allvino_client_email', inputEmail);
      localStorage.setItem('allvino_client_uf', inputUf);
      setSelectedUf(inputUf);
      setIsAuthorized(true);
    } catch (err) {
      setErrorAccess('Ocorreu um erro ao salvar o acesso. Tente novamente.');
    } finally {
      setLoadingAccess(false);
    }
  };

  // Se não estiver autorizado, exibe a tela de login simples (Acesso do Cliente)
  if (!isAuthorized) {
    return (
      <div className="mx-auto my-12 max-w-md">
        <div className="rounded-2xl border border-stone-700/60 bg-stone-900/60 p-8 shadow-soft backdrop-blur-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-allvino-500/10 text-gold-500 mb-4 ring-1 ring-allvino-500/20">
              <WineIcon className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-stone-50">
              Acesso ao Catálogo
            </h2>
            <p className="mt-2 text-sm text-stone-400">
              Por favor, informe seus dados abaixo para acessar nosso catálogo B2B de vinhos.
            </p>
          </div>

          <form onSubmit={handleAccessSubmit} className="space-y-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <label htmlFor="client-name" className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Seu Nome Completo *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="client-name"
                  type="text"
                  required
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full rounded-xl border border-stone-700 bg-stone-950/40 py-3 pl-10 pr-4 text-sm text-stone-200 placeholder-stone-600 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition duration-200"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label htmlFor="client-phone" className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Seu WhatsApp / Telefone *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="client-phone"
                  type="tel"
                  required
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  placeholder="Ex: (11) 98888-8888"
                  className="w-full rounded-xl border border-stone-700 bg-stone-950/40 py-3 pl-10 pr-4 text-sm text-stone-200 placeholder-stone-600 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition duration-200"
                />
              </div>
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <label htmlFor="client-email" className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Seu E-mail *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="client-email"
                  type="email"
                  required
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="Ex: joao@email.com"
                  className="w-full rounded-xl border border-stone-700 bg-stone-950/40 py-3 pl-10 pr-4 text-sm text-stone-200 placeholder-stone-600 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition duration-200"
                />
              </div>
            </div>

            {/* Estado (UF) */}
            <div className="space-y-1.5">
              <label htmlFor="client-uf" className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Seu Estado (UF) *
              </label>
              <select
                id="client-uf"
                required
                value={inputUf}
                onChange={(e) => setInputUf(e.target.value)}
                className="w-full rounded-xl border border-stone-700 bg-stone-950/40 py-3 px-3 text-sm text-stone-200 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition duration-200 cursor-pointer appearance-none"
              >
                <option value="" disabled className="bg-stone-900 text-stone-600">Selecione seu estado</option>
                {ESTADOS_UF.map((uf) => (
                  <option key={uf} value={uf} className="bg-stone-900 text-stone-200">{uf}</option>
                ))}
                <option value="OUTRO" className="bg-stone-900 text-gold-500 font-bold">Não Definido / Outro Estado</option>
              </select>
            </div>

            {inputUf === 'OUTRO' && (
              <div className="p-3 bg-gold-900/10 border border-gold-900/20 rounded-xl text-xs text-gold-500 leading-normal flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5 text-gold-500" />
                <span>
                  Para orçamentos nesta região, sugerimos entrar em contato com nossa Central pelo Telefone/WhatsApp: <strong>27 3261-9494</strong>
                </span>
              </div>
            )}

            {errorAccess && (
              <p className="text-xs text-rose-500 font-medium">{errorAccess}</p>
            )}

            <button
              type="submit"
              disabled={loadingAccess}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-allvino-500 py-3 text-sm font-semibold text-white transition hover:bg-allvino-600 active:scale-98 disabled:opacity-50"
            >
              <span>Acessar Catálogo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Visualização principal do catálogo do cliente após login
  return (
    <div className="space-y-6 pb-32">
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
