'use client';

import { useState, useEffect } from 'react';
import { FileDown, Loader2, X, Wine } from 'lucide-react';
import { useSelectionStore } from '@/store/selection-store';
import { generateCatalogPdfWithImages, downloadBlob } from '@/lib/pdf/generate-catalog-pdf';
import { createBrowserSupabase } from '@/lib/supabase-client';
import { saveCatalogHistoryAction, recordWineEventAction } from '@/app/actions/analytics';

const BRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FloatingPdfButton() {
  const { selected, count, total, clear } = useSelectionStore();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Estados do formulário de termos e representante
  const [repName, setRepName] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [freightInfo, setFreightInfo] = useState('');

  const [isRep, setIsRep] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Carregar dados salvos no localStorage (apenas no cliente após montagem)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRepName(localStorage.getItem('allvino_pdf_rep_name') || '');
      setRepPhone(localStorage.getItem('allvino_pdf_rep_phone') || '');
      setMinOrder(localStorage.getItem('allvino_pdf_min_order') || '');
      setDeliveryTime(localStorage.getItem('allvino_pdf_delivery_time') || '');
      setFreightInfo(localStorage.getItem('allvino_pdf_freight_info') || '');
    }
    
    // Checar se o usuário é representante (sessão ativa)
    async function checkSession() {
      try {
        const clientSupabase = createBrowserSupabase();
        const { data: { session } } = await clientSupabase.auth.getSession();
        setIsRep(!!session?.user);
      } catch (err) {
        console.error('Error checking representative session', err);
      }
    }
    checkSession();
  }, []);

  if (count === 0) return null;

  // Handlers para salvar no localStorage conforme digita
  const handleRepNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRepName(val);
    localStorage.setItem('allvino_pdf_rep_name', val);
  };

  const handleRepPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRepPhone(val);
    localStorage.setItem('allvino_pdf_rep_phone', val);
  };

  const handleMinOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMinOrder(val);
    localStorage.setItem('allvino_pdf_min_order', val);
  };

  const handleDeliveryTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDeliveryTime(val);
    localStorage.setItem('allvino_pdf_delivery_time', val);
  };

  const handleFreightInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFreightInfo(val);
    localStorage.setItem('allvino_pdf_freight_info', val);
  };

  async function handleGenerate() {
    setLoading(true);
    try {
      const wines = Object.values(selected);
      const blob = await generateCatalogPdfWithImages(wines, {
        companyName: 'Allvino B2B',
        primaryColor: '#A61C3C',
        title: `Catálogo Personalizado de Vinhos`,
        site: 'www.allvino.com.br',
        email: 'comercial@allvino.com.br',
        phone: '+55 11 99999-9999',
        representativeName: repName,
        representativePhone: repPhone,
        minOrder: minOrder,
        deliveryTime: deliveryTime,
        freightInfo: freightInfo,
        footerMessage: 'Catálogo de atacado Allvino B2B. Preços e safras válidos por 7 dias ou até durar o estoque.',
      });
      const filename = `allvino-b2b-catalogo-${new Date().toISOString().slice(0, 10)}.pdf`;
      downloadBlob(blob, filename);

      // Registrar orçamento em banco caso seja representante logado
      if (isRep) {
        await saveCatalogHistoryAction({
          clienteNome: clientName || 'Cliente Geral B2B',
          clienteWhatsapp: clientPhone || '',
          condicoesComerciais: {
            frete: freightInfo || 'A combinar',
            prazo: deliveryTime || 'A combinar',
            pedidoMinimo: minOrder || 'A combinar'
          },
          vinhosSelecionados: wines.map(w => ({
            id: w.id,
            nome: w.nome,
            preco_atacado: w.preco_atacado,
            tipo: w.tipo
          }))
        });

        // Registrar métrica de download para cada vinho selecionado
        for (const w of wines) {
          await recordWineEventAction(w.id, 'download');
        }
      }

      setOpen(false);
    } catch (err) {
      console.error('Falha ao gerar PDF', err);
      alert('Não foi possível gerar o PDF. Verifique sua conexão ou tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-allvino-600 px-5 py-4 text-sm font-semibold text-white shadow-2xl ring-1 ring-allvino-700/20 transition hover:scale-105 hover:bg-allvino-700 active:scale-100"
      >
        <FileDown className="h-5 w-5" />
        <span className="hidden xs:inline sm:inline">
          Gerar Catálogo PDF ({count})
        </span>
        <span className="xs:hidden sm:hidden">PDF ({count})</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-allvino-50 text-allvino-600">
                  <Wine className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl font-medium text-stone-900">
                  Gerar Catálogo PDF
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-full p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-display-wide text-stone-500">
                  Itens selecionados
                </span>
                <span className="font-display text-2xl font-semibold text-allvino-700">
                  {count}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-stone-200 pt-2">
                <span className="text-xs uppercase tracking-display-wide text-stone-500">
                  Total estimado
                </span>
                <span className="font-display text-base font-medium text-stone-900">
                  {BRL(total)}
                </span>
              </div>
            </div>

            {/* Form de Dados do Representante e Comerciais */}
            <div className="mb-5 space-y-3.5 border-t border-stone-200 pt-4">
              <h3 className="font-display text-sm font-semibold text-stone-900">
                Identificação & Condições Comerciais
              </h3>

              {isRep && (
                <div className="rounded-xl border border-rose-200/60 bg-rose-50/20 p-3.5 space-y-2.5 mb-3">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-1.5 mb-1.5">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                      Área do Representante
                    </span>
                    <span className="text-[9px] font-medium text-stone-400">
                      Registro de Histórico Ativo
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="clientName" className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Nome do Cliente / Empresa
                      </label>
                      <input
                        id="clientName"
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        disabled={loading}
                        placeholder="Ex: Restaurante Fasano"
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-allvino-500 focus:outline-none focus:ring-1 focus:ring-allvino-500 disabled:bg-stone-50 disabled:text-stone-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="clientPhone" className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        WhatsApp do Cliente
                      </label>
                      <input
                        id="clientPhone"
                        type="text"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        disabled={loading}
                        placeholder="Ex: (11) 98888-8888"
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-allvino-500 focus:outline-none focus:ring-1 focus:ring-allvino-500 disabled:bg-stone-50 disabled:text-stone-400"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="repName" className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Representante
                  </label>
                  <input
                    id="repName"
                    type="text"
                    value={repName}
                    onChange={handleRepNameChange}
                    disabled={loading}
                    placeholder="Nome completo"
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-allvino-500 focus:outline-none focus:ring-1 focus:ring-allvino-500 disabled:bg-stone-50 disabled:text-stone-400"
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="repPhone" className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    WhatsApp de Vendas
                  </label>
                  <input
                    id="repPhone"
                    type="text"
                    value={repPhone}
                    onChange={handleRepPhoneChange}
                    disabled={loading}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-allvino-500 focus:outline-none focus:ring-1 focus:ring-allvino-500 disabled:bg-stone-50 disabled:text-stone-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <label htmlFor="minOrder" className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Pedido Mínimo
                  </label>
                  <input
                    id="minOrder"
                    type="text"
                    value={minOrder}
                    onChange={handleMinOrderChange}
                    disabled={loading}
                    placeholder="Ex: R$ 500"
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-allvino-500 focus:outline-none focus:ring-1 focus:ring-allvino-500 disabled:bg-stone-50 disabled:text-stone-400"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label htmlFor="deliveryTime" className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Prazo Entrega
                  </label>
                  <input
                    id="deliveryTime"
                    type="text"
                    value={deliveryTime}
                    onChange={handleDeliveryTimeChange}
                    disabled={loading}
                    placeholder="Ex: 3 a 5 dias"
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-allvino-500 focus:outline-none focus:ring-1 focus:ring-allvino-500 disabled:bg-stone-50 disabled:text-stone-400"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label htmlFor="freightInfo" className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Frete / Envio
                  </label>
                  <input
                    id="freightInfo"
                    type="text"
                    value={freightInfo}
                    onChange={handleFreightInfoChange}
                    disabled={loading}
                    placeholder="Ex: CIF / FOB"
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-allvino-500 focus:outline-none focus:ring-1 focus:ring-allvino-500 disabled:bg-stone-50 disabled:text-stone-400"
                  />
                </div>
              </div>
            </div>

            <p className="mb-5 text-xs leading-relaxed text-stone-500">
              O PDF incluirá capa personalizada com seus dados de contato e os vinhos selecionados organizados por categoria.
            </p>

            <div className="flex gap-2">
              <button
                onClick={clear}
                disabled={loading}
                className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
              >
                Limpar tudo
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-allvino-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-allvino-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando Catálogo...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    Baixar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
