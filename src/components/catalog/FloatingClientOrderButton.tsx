'use client';

import { useState, useEffect } from 'react';
import { Loader2, X, MessageSquare, Wine } from 'lucide-react';
import { useSelectionStore } from '@/store/selection-store';
import { shareCatalogHistoryAction } from '@/app/actions/catalogs';
import { recordWineEventAction } from '@/app/actions/analytics';
import { getRepresentativeNameByPhoneAction } from '@/app/actions/representatives';

const BRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FloatingClientOrderButton() {
  const { selected, count, total, clear, updateQuantity } = useSelectionStore();
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);

  // Estados do cliente e do representante
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [repName, setRepName] = useState('Central de Vendas');
  const [repPhone, setRepPhone] = useState('27995145536');

  // Função para buscar nome do representante pelo telefone digitado
  const handleRepPhoneChange = async (val: string) => {
    setRepPhone(val);
    const cleanPhone = val.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      try {
        const res = await getRepresentativeNameByPhoneAction(cleanPhone);
        if (res.nome) {
          setRepName(res.nome);
          localStorage.setItem('allvino_client_rep_name', res.nome);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Carregar dados salvos no localStorage no client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setClientPhone(localStorage.getItem('allvino_client_phone') || '');
      setClientName(localStorage.getItem('allvino_client_name') || '');
      setClientEmail(localStorage.getItem('allvino_client_email') || '');
      
      const storedRepName = localStorage.getItem('allvino_client_rep_name');
      const storedRepPhone = localStorage.getItem('allvino_client_rep_phone');

      if (storedRepPhone) {
        setRepPhone(storedRepPhone);
        // Tenta buscar o nome atualizado do representante no banco pelo telefone
        getRepresentativeNameByPhoneAction(storedRepPhone).then((res) => {
          if (res.nome) {
            setRepName(res.nome);
            localStorage.setItem('allvino_client_rep_name', res.nome);
          } else if (storedRepName) {
            setRepName(storedRepName);
          }
        }).catch(() => {
          if (storedRepName) setRepName(storedRepName);
        });
      } else {
        if (storedRepName) setRepName(storedRepName);
      }
    }
  }, [open]);

  if (count === 0) return null;

  async function handleSendOrder() {
    if (!clientName.trim()) {
      alert('Por favor, informe seu nome.');
      return;
    }
    if (!clientPhone.trim()) {
      alert('Por favor, informe seu WhatsApp/Telefone de contato.');
      return;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      alert('Por favor, informe um e-mail válido.');
      return;
    }
    if (!repPhone.trim()) {
      alert('Por favor, informe o WhatsApp do Representante ou Central.');
      return;
    }

    setSending(true);
    try {
      const wines = Object.values(selected);
      const cleanRepPhone = repPhone.replace(/\D/g, '');
      const cleanClientPhone = clientPhone.replace(/\D/g, '');

      // 1. Salvar no localStorage
      localStorage.setItem('allvino_client_phone', clientPhone);
      localStorage.setItem('allvino_client_name', clientName);
      localStorage.setItem('allvino_client_email', clientEmail);
      localStorage.setItem('allvino_client_rep_name', repName);
      localStorage.setItem('allvino_client_rep_phone', cleanRepPhone);

      // 2. Salvar histórico de orçamentos no banco de dados
      const logClientName = clientEmail ? `${clientName} (${clientEmail})` : clientName;
      const shareRes = await shareCatalogHistoryAction({
        clienteNome: logClientName,
        clienteWhatsapp: cleanClientPhone,
        pdfUrl: 'Solicitação de Orçamento via WhatsApp',
        representativeNome: repName,
        condicoesComerciais: {
          frete: 'A combinar',
          prazo: 'A combinar',
          pedidoMinimo: 'A combinar',
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
        console.warn('Erro ao salvar registro de solicitação no histórico:', shareRes.error);
      }

      // 3. Registrar métrica de 'download' (ou interação) para cada vinho solicitado
      for (const w of wines) {
        await recordWineEventAction(w.id, 'download');
      }

      // 4. Montar a mensagem pré-formatada do WhatsApp
      let itemsListText = '';
      wines.forEach((w) => {
        const qty = w.quantity || 1;
        itemsListText += `- ${qty}x ${w.nome} (${BRL(w.preco_atacado)}/un) - Subtotal: ${BRL(w.preco_atacado * qty)}\n`;
      });

      const messageText = `🍷 *ALLVINO B2B - SOLICITAÇÃO DE ORÇAMENTO*\n\n` +
        `Olá, *${repName}*!\n` +
        `Gostaria de solicitar um orçamento para a minha seleção de vinhos:\n\n` +
        `----------------------------------------\n` +
        `${itemsListText}` +
        `----------------------------------------\n\n` +
        `*Total Estimado:* ${BRL(total)}\n\n` +
        `*Identificação do Cliente:*\n` +
        `- Nome: ${clientName}\n` +
        `- WhatsApp: ${clientPhone}\n` +
        `- E-mail: ${clientEmail}\n\n` +
        `Por favor, me informe as condições comerciais para fecharmos o pedido. Obrigado!`;

      const encodedText = encodeURIComponent(messageText);
      const waUrl = `https://wa.me/${cleanRepPhone}?text=${encodedText}`;

      // 5. Redirecionar para o WhatsApp
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      window.open(waUrl, isMobile ? '_self' : '_blank', 'noopener,noreferrer');

      setOpen(false);
    } catch (err: any) {
      console.error('Falha ao processar solicitação de orçamento', err);
      alert(`Não foi possível enviar o pedido via WhatsApp: ${err.message || err}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-lift ring-1 ring-emerald-500/25 transition hover:scale-105 hover:bg-emerald-500 active:scale-100 duration-200"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="hidden sm:inline">
          Solicitar Orçamento ({count})
        </span>
        <span className="sm:hidden">Orçamento ({count})</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => !sending && setOpen(false)}
        >
          <div
            className="w-full max-w-md max-h-[92vh] flex flex-col rounded-t-2xl bg-stone-800 border-t border-stone-700 p-6 shadow-soft sm:rounded-2xl sm:border overflow-y-auto scrollbar-thin scrollbar-thumb-stone-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Wine className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl font-medium text-stone-50">
                  Enviar Solicitação
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={sending}
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
                <span className="font-display text-2xl font-semibold text-emerald-400">
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

            {/* Inputs de Envio */}
            <div className="mb-5 space-y-3.5 border-t border-stone-700 pt-4 max-h-[220px] sm:max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-700">
              <h3 className="font-display text-sm font-semibold text-stone-200">
                Informações de Contato
              </h3>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label htmlFor="clientName" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Seu Nome Completo *
                  </label>
                  <input
                    id="clientName"
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    disabled={sending}
                    placeholder="Ex: João Silva"
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-stone-950 disabled:text-stone-600"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="clientPhone" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Seu WhatsApp / Telefone *
                  </label>
                  <input
                    id="clientPhone"
                    type="text"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    disabled={sending}
                    placeholder="Ex: (11) 98888-8888"
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-stone-950 disabled:text-stone-600"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="clientEmail" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Seu E-mail *
                  </label>
                  <input
                    id="clientEmail"
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    disabled={sending}
                    placeholder="Ex: joao@email.com"
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-stone-950 disabled:text-stone-600"
                  />
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
                      onChange={(e) => setRepName(e.target.value)}
                      disabled={sending}
                      placeholder="Nome do representante"
                      className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-stone-950 disabled:text-stone-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="repPhone" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      WhatsApp de Destino
                    </label>
                    <input
                      id="repPhone"
                      type="text"
                      required
                      value={repPhone}
                      onChange={(e) => handleRepPhoneChange(e.target.value)}
                      onBlur={async () => {
                        const cleanPhone = repPhone.replace(/\D/g, '');
                        if (cleanPhone) {
                          const res = await getRepresentativeNameByPhoneAction(cleanPhone);
                          if (res.nome) {
                            setRepName(res.nome);
                            localStorage.setItem('allvino_client_rep_name', res.nome);
                          }
                        }
                      }}
                      disabled={sending}
                      placeholder="Ex: (27) 99514-5536"
                      className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-stone-950 disabled:text-stone-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="mb-5 text-xs leading-relaxed text-stone-400">
              Sua lista de vinhos selecionados será compilada e enviada via WhatsApp para que possamos validar safras, fretes e gerar seu orçamento.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleSendOrder}
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-98 disabled:opacity-50 shadow-sm"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 fill-current" />
                    Enviar via WhatsApp
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={clear}
                  disabled={sending}
                  className="rounded-lg border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm font-medium text-stone-300 transition hover:bg-stone-800 disabled:opacity-50"
                >
                  Limpar seleção
                </button>
                <button
                  onClick={() => setOpen(false)}
                  disabled={sending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm font-medium text-stone-300 transition hover:bg-stone-800 disabled:opacity-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
