'use client';

import { useState, useEffect } from 'react';
import { FileDown, Loader2, X, Wine } from 'lucide-react';
import { useSelectionStore } from '@/store/selection-store';
import { generateCatalogPdfWithImages, downloadBlob } from '@/lib/pdf/generate-catalog-pdf';
import { createBrowserSupabase } from '@/lib/supabase-client';
import { saveCatalogHistoryAction, recordWineEventAction } from '@/app/actions/analytics';
import { uploadCatalogPdfAction, shareCatalogHistoryAction } from '@/app/actions/catalogs';
import { fetchCurrentProfileServer } from '@/app/actions/profile';
import { fetchRegionalPricesAction } from '@/app/actions/prices';

const BRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao converter Blob em base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface FloatingPdfButtonProps {
  selectedUf?: string;
  allowedUfs?: string[];
}

export function FloatingPdfButton({ selectedUf = '', allowedUfs = [] }: FloatingPdfButtonProps) {
  const { selected, count, total, clear, updateQuantity } = useSelectionStore();
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [open, setOpen] = useState(false);

  const [pdfUf, setPdfUf] = useState(selectedUf);

  useEffect(() => {
    if (selectedUf) {
      setPdfUf(selectedUf);
    } else if (typeof window !== 'undefined') {
      const clientUf = localStorage.getItem('allvino_client_uf') || '';
      setPdfUf(clientUf);
    }
  }, [selectedUf]);

  // Estados do formulário de termos e representante
  const [repName, setRepName] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [freightInfo, setFreightInfo] = useState('');

  const [isRep, setIsRep] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Configurações dinâmicas de capa do catálogo
  const [coverTheme, setCoverTheme] = useState('classic');
  const [primaryColor, setPrimaryColor] = useState('#A61C3C');
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const [customMiddleUrl, setCustomMiddleUrl] = useState<string | null>(null);
  const [customBackCoverUrl, setCustomBackCoverUrl] = useState<string | null>(null);
  const [layoutSettings, setLayoutSettings] = useState<any>({});

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
        const loggedIn = !!session?.user;
        setIsRep(loggedIn);

        if (loggedIn) {
          const res = await fetchCurrentProfileServer();
          if (res.profile) {
            if (res.profile.nome) {
              setRepName(res.profile.nome);
              localStorage.setItem('allvino_pdf_rep_name', res.profile.nome);
            }
            if (res.profile.whatsapp) {
              const clean = res.profile.whatsapp.replace(/\D/g, '');
              let formatted = res.profile.whatsapp;
              if (clean.length === 11) {
                formatted = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
              } else if (clean.length === 10) {
                formatted = `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
              }
              setRepPhone(formatted);
              localStorage.setItem('allvino_pdf_rep_phone', formatted);
            }
          }
        }
      } catch (err) {
        console.error('Error checking representative session', err);
      }
    }

    // Carregar configurações do catálogo (tema de capa e cores)
    async function loadCatalogSettings() {
      try {
        const clientSupabase = createBrowserSupabase();
        const { data, error } = await clientSupabase
          .from('catalog_settings')
          .select(`
            cover_theme, 
            primary_color, 
            custom_cover_url, 
            custom_middle_url, 
            custom_back_cover_url,
            cover_show_rep,
            cover_rep_y,
            cover_text_color,
            cover_show_date,
            cover_date_y,
            middle_show_header,
            middle_header_color,
            middle_show_footer,
            middle_footer_color,
            middle_bg_cards,
            back_cover_show_info,
            back_cover_info_y,
            back_cover_info_color,
            show_box_price,
            box_price_label,
            show_unit_price,
            unit_price_label,
            box_units,
            show_country,
            show_region,
            show_grape,
            show_vintage,
            show_type,
            show_description,
            middle_product_name_color,
            middle_price_color,
            middle_tech_info_color
          `)
          .eq('id', 'default')
          .single();
        if (data && !error) {
          setCoverTheme(data.cover_theme);
          setPrimaryColor(data.primary_color);
          setCustomCoverUrl(data.custom_cover_url);
          setCustomMiddleUrl(data.custom_middle_url);
          setCustomBackCoverUrl(data.custom_back_cover_url);
          setLayoutSettings({
            coverShowRep: data.cover_show_rep,
            coverRepY: data.cover_rep_y,
            coverTextColor: data.cover_text_color,
            coverShowDate: data.cover_show_date,
            coverDateY: data.cover_date_y,
            middleShowHeader: data.middle_show_header,
            middleHeaderColor: data.middle_header_color,
            middleShowFooter: data.middle_show_footer,
            middleFooterColor: data.middle_footer_color,
            middleBgCards: data.middle_bg_cards,
            backCoverShowInfo: data.back_cover_show_info,
            backCoverInfoY: data.back_cover_info_y,
            backCoverInfoColor: data.back_cover_info_color,
            showBoxPrice: data.show_box_price,
            boxPriceLabel: data.box_price_label,
            showUnitPrice: data.show_unit_price,
            unitPriceLabel: data.unit_price_label,
            boxUnits: data.box_units,
            showCountry: data.show_country,
            showRegion: data.show_region,
            showGrape: data.show_grape,
            showVintage: data.show_vintage,
            showType: data.show_type,
            showDescription: data.show_description,
            middleProductNameColor: data.middle_product_name_color,
            middlePriceColor: data.middle_price_color,
            middleTechInfoColor: data.middle_tech_info_color
          });
        }
      } catch (err) {
        console.error('Error loading catalog settings', err);
      }
    }

    checkSession();
    loadCatalogSettings();
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
      let wines = Object.values(selected);
      if (pdfUf && pdfUf !== 'OUTRO') {
        try {
          const res = await fetchRegionalPricesAction(pdfUf);
          if (res.prices && res.prices.length > 0) {
            wines = wines.map(w => {
              const regional = res.prices?.find(p => p.wine_id === w.id);
              if (regional) {
                return {
                  ...w,
                  preco_atacado: regional.preco_regional
                };
              }
              return w;
            });
          }
        } catch (err) {
          console.error('Erro ao obter preços regionais para o PDF:', err);
        }
      }

      const blob = await generateCatalogPdfWithImages(wines, {
        companyName: 'Allvino B2B',
        primaryColor: primaryColor,
        coverTheme: coverTheme,
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
        customCoverUrl: customCoverUrl || undefined,
        customMiddleUrl: customMiddleUrl || undefined,
        customBackCoverUrl: customBackCoverUrl || undefined,
        ...layoutSettings,
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
            tipo: w.tipo,
            quantidade: w.quantity || 1
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

  async function handleShare() {
    setSharing(true);
    try {
      let wines = Object.values(selected);
      if (pdfUf && pdfUf !== 'OUTRO') {
        try {
          const res = await fetchRegionalPricesAction(pdfUf);
          if (res.prices && res.prices.length > 0) {
            wines = wines.map(w => {
              const regional = res.prices?.find(p => p.wine_id === w.id);
              if (regional) {
                return {
                  ...w,
                  preco_atacado: regional.preco_regional
                };
              }
              return w;
            });
          }
        } catch (err) {
          console.error('Erro ao obter preços regionais para o PDF (compartilhar):', err);
        }
      }

      // 1. Gerar o PDF na memória usando jsPDF (retorna Blob)
      const blob = await generateCatalogPdfWithImages(wines, {
        companyName: 'Allvino B2B',
        primaryColor: primaryColor,
        coverTheme: coverTheme,
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
        customCoverUrl: customCoverUrl || undefined,
        customMiddleUrl: customMiddleUrl || undefined,
        customBackCoverUrl: customBackCoverUrl || undefined,
        ...layoutSettings,
      });

      // Nome do arquivo único
      const sanitizedClient = (clientName || 'cliente')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-');
      const filename = `catalogo-${sanitizedClient}-${Date.now()}.pdf`;

      // 2. Upload DIRETO do navegador para o Supabase Storage (bypassa Vercel e o limite de 4.5MB!)
      const supabaseBrowser = createBrowserSupabase();
      
      const { data: uploadData, error: uploadError } = await supabaseBrowser.storage
        .from('pdf-catalogs')
        .upload(filename, blob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload do PDF falhou: ${uploadError.message}`);
      }

      // 3. Obter a URL pública
      const { data: publicUrlData } = supabaseBrowser.storage
        .from('pdf-catalogs')
        .getPublicUrl(filename);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Falha ao recuperar a URL pública do catálogo.');
      }

      const pdfUrl = publicUrlData.publicUrl;

      // 4. Salvar histórico e registrar métricas
      const shareRes = await shareCatalogHistoryAction({
        clienteNome: clientName || 'Cliente Geral B2B',
        clienteWhatsapp: clientPhone || '',
        pdfUrl: pdfUrl,
        representativeNome: repName || undefined,
        condicoesComerciais: {
          frete: freightInfo || 'A combinar',
          prazo: deliveryTime || 'A combinar',
          pedidoMinimo: minOrder || 'A combinar'
        },
        vinhosSelecionados: wines.map(w => ({
          id: w.id,
          nome: w.nome,
          preco_atacado: w.preco_atacado,
          tipo: w.tipo,
          quantidade: w.quantity || 1
        }))
      });

      if (!shareRes.success) {
        console.warn('Erro ao salvar registro de compartilhamento no histórico:', shareRes.error);
      }

      // 5. Redirecionar para wa.me com a mensagem pré-formatada
      const cleanPhone = clientPhone.replace(/\D/g, '');
      const defaultText = `Olá${clientName ? ` ${clientName}` : ''}! Segue o link com o catálogo de vinhos premium personalizado que preparei para você: ${pdfUrl}`;
      const encodedText = encodeURIComponent(defaultText);

      const waUrl = cleanPhone 
        ? `https://wa.me/${cleanPhone}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;

      // Abrir na mesma aba para mobile ou nova aba para desktop
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      window.open(waUrl, isMobile ? '_self' : '_blank', 'noopener,noreferrer');

      setOpen(false);
    } catch (err: any) {
      console.error('Falha ao compartilhar via WhatsApp', err);
      alert(`Não foi possível gerar ou enviar o link do catálogo: ${err.message || err}`);
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-allvino-500 px-5 py-4 text-sm font-semibold text-white shadow-lift ring-1 ring-allvino-600/25 transition hover:scale-105 hover:bg-allvino-600 active:scale-100 duration-200"
      >
        <FileDown className="h-5 w-5" />
        <span className="hidden sm:inline">
          Gerar Catálogo PDF ({count})
        </span>
        <span className="sm:hidden">PDF ({count})</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="w-full max-w-md max-h-[92vh] flex flex-col rounded-t-2xl bg-stone-800 border-t border-stone-700 p-6 shadow-soft sm:rounded-2xl sm:border overflow-y-auto scrollbar-thin scrollbar-thumb-stone-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-allvino-500/10 text-gold-500">
                  <Wine className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl font-medium text-stone-50">
                  Gerar Catálogo PDF
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-900 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 rounded-xl border border-stone-700 bg-stone-900 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-display-wide text-stone-400">
                  Itens selecionados
                </span>
                <span className="font-display text-2xl font-semibold text-gold-400">
                  {count}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-stone-700 pt-2">
                <span className="text-xs uppercase tracking-display-wide text-stone-400">
                  Total estimado
                </span>
                <span className="font-display text-base font-medium text-stone-200">
                  {BRL(total)}
                </span>
              </div>
            </div>

            {/* Listagem de itens selecionados com quantidade */}
            <div className="mb-5 border-t border-stone-700 pt-4">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-stone-200 mb-3">
                Itens no Orçamento
              </h3>
              <div className="max-h-[160px] overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-stone-700">
                {Object.values(selected).map((w) => {
                  const qty = w.quantity || 1;
                  return (
                    <div key={w.id} className="flex items-center justify-between gap-3 bg-stone-900/60 p-2.5 rounded-lg border border-stone-700/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-200 truncate">{w.nome}</p>
                        <p className="text-[10px] text-stone-400 truncate">{w.produtor} • {w.tipo}</p>
                        <p className="text-[10px] text-gold-500 font-mono mt-0.5">{BRL(w.preco_atacado)}/un</p>
                      </div>
                      
                      {/* Seletor de Quantidade */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center rounded-lg bg-stone-950 border border-stone-850 p-0.5">
                          <button
                            onClick={() => updateQuantity(w.id, qty - 1)}
                            className="w-6 h-6 flex items-center justify-center rounded text-xs text-stone-400 hover:text-stone-100 hover:bg-stone-850 transition-colors"
                            title="Diminuir quantidade"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-semibold text-stone-200 font-mono">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(w.id, qty + 1)}
                            className="w-6 h-6 flex items-center justify-center rounded text-xs text-stone-400 hover:text-stone-100 hover:bg-stone-850 transition-colors"
                            title="Aumentar quantidade"
                          >
                            +
                          </button>
                        </div>
                        
                        {/* Subtotal por Item */}
                        <div className="text-right w-16 flex-shrink-0">
                          <span className="text-xs font-semibold text-stone-200 font-mono block">
                            {BRL(w.preco_atacado * qty)}
                          </span>
                        </div>

                        {/* Botão de Exclusão */}
                        <button
                          onClick={() => updateQuantity(w.id, 0)}
                          className="text-stone-500 hover:text-red-400 p-1 transition-colors"
                          title="Remover item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form de Dados do Representante e Comerciais */}
            <div className="mb-5 space-y-3.5 border-t border-stone-700 pt-4">
              <h3 className="font-display text-sm font-semibold text-stone-200">
                Identificação & Condições Comerciais
              </h3>

              {allowedUfs.length > 0 && (
                <div className="space-y-1 rounded-xl border border-stone-700/60 bg-stone-900/40 p-3.5">
                  <label htmlFor="pdf-uf" className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Tabela de Preços (Estado/UF)
                  </label>
                  <select
                    id="pdf-uf"
                    value={pdfUf}
                    onChange={(e) => setPdfUf(e.target.value)}
                    disabled={loading || sharing}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-gold-500 font-bold focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-stone-900 text-stone-400">Preço Nacional Padrão</option>
                    {allowedUfs.map((uf) => (
                      <option key={uf} value={uf} className="bg-stone-900 text-stone-200">{uf}</option>
                    ))}
                    <option value="OUTRO" className="bg-stone-900 text-stone-400">Não Definido / Outro (Central)</option>
                  </select>
                </div>
              )}

              <div className="rounded-xl border border-stone-700/60 bg-stone-900/40 p-3.5 space-y-2.5 mb-3">
                <div className="flex items-center justify-between border-b border-stone-700/55 pb-1.5 mb-1.5">
                  <span className="text-[10px] font-bold text-gold-500 uppercase tracking-wider">
                    Dados do Destinatário (Cliente)
                  </span>
                  <span className="text-[9px] font-medium">
                    {isRep ? (
                      <span className="text-emerald-400 font-semibold">Registro de Histórico Ativo</span>
                    ) : (
                      <span className="text-stone-400">Opcional • Envio WhatsApp</span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="clientName" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Nome do Cliente / Empresa
                    </label>
                    <input
                      id="clientName"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      disabled={loading || sharing}
                      placeholder="Ex: Restaurante Fasano"
                      className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-stone-950 disabled:text-stone-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="clientPhone" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      WhatsApp do Cliente
                    </label>
                    <input
                      id="clientPhone"
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      disabled={loading || sharing}
                      placeholder="Ex: (11) 98888-8888"
                      className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-stone-950 disabled:text-stone-600"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="repName" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Representante
                  </label>
                  <input
                    id="repName"
                    type="text"
                    value={repName}
                    onChange={handleRepNameChange}
                    disabled={loading || sharing}
                    placeholder="Nome completo"
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-stone-950 disabled:text-stone-600"
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="repPhone" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    WhatsApp de Vendas
                  </label>
                  <input
                    id="repPhone"
                    type="text"
                    value={repPhone}
                    onChange={handleRepPhoneChange}
                    disabled={loading || sharing}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-stone-950 disabled:text-stone-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <label htmlFor="minOrder" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Pedido Mínimo
                  </label>
                  <input
                    id="minOrder"
                    type="text"
                    value={minOrder}
                    onChange={handleMinOrderChange}
                    disabled={loading || sharing}
                    placeholder="Ex: R$ 500"
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-stone-950 disabled:text-stone-600"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label htmlFor="deliveryTime" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Prazo Entrega
                  </label>
                  <input
                    id="deliveryTime"
                    type="text"
                    value={deliveryTime}
                    onChange={handleDeliveryTimeChange}
                    disabled={loading || sharing}
                    placeholder="Ex: 3 a 5 dias"
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-stone-950 disabled:text-stone-600"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label htmlFor="freightInfo" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Frete / Envio
                  </label>
                  <input
                    id="freightInfo"
                    type="text"
                    value={freightInfo}
                    onChange={handleFreightInfoChange}
                    disabled={loading || sharing}
                    placeholder="Ex: CIF / FOB"
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-stone-950 disabled:text-stone-600"
                  />
                </div>
              </div>
            </div>

            <p className="mb-5 text-xs leading-relaxed text-stone-400">
              O PDF incluirá capa personalizada com seus dados de contato e os vinhos selecionados organizados por categoria.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleShare}
                disabled={loading || sharing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-98 disabled:opacity-50 shadow-sm"
              >
                {sharing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando Link WhatsApp...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Compartilhar Link no WhatsApp
                  </>
                )}
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={clear}
                  disabled={loading || sharing}
                  className="rounded-lg border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm font-medium text-stone-300 transition hover:bg-stone-800 disabled:opacity-50"
                >
                  Limpar tudo
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading || sharing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-allvino-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-allvino-600 disabled:opacity-50"
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
        </div>
      )}
    </>
  );
}
