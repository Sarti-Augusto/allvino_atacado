'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Database, 
  Upload, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ArrowLeft,
  Info,
  RefreshCw,
  Search
} from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase-client';
import { 
  importRegionalPricesAction, 
  fetchRegionalPricesAction, 
  deleteRegionalPriceAction,
  type RegionalPriceRow,
  type RegionalPriceImportResult
} from '@/app/actions/prices';

const ESTADOS_UF = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function PricesPage() {
  const [selectedUf, setSelectedUf] = useState<string>('SP');
  const [prices, setPrices] = useState<RegionalPriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // CSV Upload States
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<RegionalPriceImportResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // States para Ações individuais
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // Status/Toast Geral
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const loadPrices = async (uf: string) => {
    setLoading(true);
    setImportResult(null);
    setFileError(null);
    try {
      const res = await fetchRegionalPricesAction(uf);
      if (res.error) {
        showToast('error', res.error);
      } else if (res.prices) {
        setPrices(res.prices);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Erro ao carregar preços regionais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function checkPermissions() {
      try {
        const clientSupabase = createBrowserSupabase();
        const { data: { session } } = await clientSupabase.auth.getSession();
        
        if (!session?.user) {
          window.location.href = '/admin/login';
          return;
        }

        const { data: profile, error } = await clientSupabase
          .from('admin_users')
          .select('ativo, role')
          .eq('id', session.user.id)
          .single();

        if (error || !profile || !profile.ativo) {
          window.location.href = '/admin/login';
          return;
        }

        if (profile.role !== 'admin' && profile.role !== 'owner') {
          window.location.href = '/admin';
          return;
        }

        loadPrices(selectedUf);
      } catch (err) {
        console.error('Error verifying permissions:', err);
        window.location.href = '/admin';
      }
    }

    checkPermissions();
  }, [selectedUf]);

  const handleDeletePrice = async (id: string) => {
    if (!confirm('Deseja realmente remover este preço regional? O produto voltará a utilizar o preço nacional padrão.')) {
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await deleteRegionalPriceAction(id);
      if (res.error) {
        showToast('error', res.error);
      } else {
        setPrices((prev) => prev.filter((p) => p.id !== id));
        showToast('success', 'Preço regional removido com sucesso. Fallback de preço padrão ativado.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Erro ao remover preço regional.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const parseCSV = (text: string): Array<{ sku: string; price: number }> => {
    // 1. Remover UTF-8 BOM se presente
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    
    // 2. Dividir em linhas tratando \r\n, \r e \n
    const lines = cleanText.split(/\r\n|\r|\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 2) return [];

    // 3. Detectar delimitador (vírgula, ponto e vírgula ou tabulação)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes(';')) delimiter = ';';
    else if (firstLine.includes('\t')) delimiter = '\t';

    // 4. Limpar e normalizar cabeçalhos removendo aspas extras
    const headers = firstLine
      .split(delimiter)
      .map(h => h.replace(/["']/g, '').trim().toLowerCase());
    
    // 5. Identificar índices das colunas
    let skuIdx = headers.findIndex(h => h.includes('sku') || h.includes('cod') || h.includes('cód'));
    let priceIdx = headers.findIndex(h => h.includes('prec') || h.includes('preç') || h.includes('val') || h.includes('pric'));

    // Fallbacks inteligentes se não encontrar cabeçalhos mapeados
    if (skuIdx === -1) skuIdx = 0;
    if (priceIdx === -1) priceIdx = headers.length > 1 ? 1 : 0;

    const records: Array<{ sku: string; price: number }> = [];

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(delimiter).map(c => c.trim());
      if (columns.length <= Math.max(skuIdx, priceIdx)) continue;

      // 6. Limpar aspas das células de dados
      const sku = columns[skuIdx]?.replace(/["']/g, '').trim();
      const rawPrice = columns[priceIdx]?.replace(/["']/g, '').trim();

      if (!sku || !rawPrice) continue;

      // 7. Limpeza de formatação financeira brasileira
      // Exemplo: "R$ 1.250,90" -> "1250.90", "49,90" -> "49.90", "1500" -> "1500"
      let cleanPrice = rawPrice
        .replace(/R\$\s?/i, '')
        .replace(/\s/g, ''); // Remove espaços internos no preço
        
      // Se tiver mais de uma vírgula ou ponto, precisamos tratar separadores de milhar
      // Se tiver vírgula e ponto: remove o ponto e troca a vírgula por ponto (e.g. 1.250,50 -> 1250.50)
      if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
        cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.');
      } else if (cleanPrice.includes(',')) {
        // Se tiver apenas vírgula: trata como separador decimal (e.g. 49,90 -> 49.90)
        cleanPrice = cleanPrice.replace(',', '.');
      }

      const price = parseFloat(cleanPrice);

      if (sku && !isNaN(price) && price >= 0) {
        records.push({ sku, price });
      }
    }

    return records;
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setFileError('Por favor, envie apenas arquivos no formato CSV.');
      return;
    }

    setFileError(null);
    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const records = parseCSV(text);

      if (records.length === 0) {
        setFileError('Não foi possível extrair registros válidos do CSV. Verifique se possui cabeçalhos como "sku" e "preco".');
        setImporting(false);
        return;
      }

      // Executa a server action para salvar em lote no banco
      const res = await importRegionalPricesAction(selectedUf, records);
      setImportResult(res);

      if (res.success) {
        showToast('success', `${res.importedCount} preços importados com sucesso para a UF ${selectedUf}!`);
        // Recarregar preços atualizados da tabela
        const refreshRes = await fetchRegionalPricesAction(selectedUf);
        if (refreshRes.prices) {
          setPrices(refreshRes.prices);
        }
      } else if (res.error) {
        setFileError(res.error);
      }
    } catch (err) {
      console.error(err);
      setFileError('Erro ao ler ou processar o arquivo CSV.');
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Filtragem dinâmica local por SKU/Nome do produto
  const filteredPrices = prices.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.sku.toLowerCase().includes(term) ||
      p.nome.toLowerCase().includes(term) ||
      p.produtor.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in text-stone-200 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed bottom-5 right-5 p-4 rounded-xl border z-50 flex items-center gap-3 shadow-2xl transition-all duration-300 max-w-sm ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-800 text-emerald-400' 
            : 'bg-red-950/90 border-red-800 text-red-400'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <p className="text-xs font-semibold leading-normal">{toastMsg.text}</p>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <Link href="/admin" className="text-[10px] uppercase font-bold tracking-wider hover:text-stone-300 transition-colors">
              Painel
            </Link>
            <span className="text-[10px] font-bold">/</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gold-500">Tabelas de Preços</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-stone-50 tracking-display uppercase flex items-center gap-2">
            Tabelas de Preços por UF
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Importe listas de preços customizadas por Estado (UF) e gerencie exceções regionais de cobrança.
          </p>
        </div>
      </div>

      {/* Grid Principal: Upload de CSV + Informações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload de CSV */}
        <div className="lg:col-span-2 bg-stone-850 border border-stone-800 rounded-xl p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-300 tracking-wider uppercase flex items-center gap-2">
              Importar Preços por UF
            </h3>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">UF Alvo:</span>
              <select
                value={selectedUf}
                onChange={(e) => setSelectedUf(e.target.value)}
                disabled={importing}
                className="bg-stone-900 border border-stone-800 rounded px-2.5 py-1 text-xs text-stone-200 focus:outline-none focus:border-gold-500 cursor-pointer appearance-none font-bold"
              >
                {ESTADOS_UF.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Área Drag & Drop */}
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center gap-4 relative select-none min-h-[180px] ${
              dragActive 
                ? 'border-gold-500 bg-gold-500/5' 
                : 'border-stone-800 bg-stone-900/40 hover:border-stone-700'
            }`}
          >
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileInput}
              disabled={importing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
            />
            {importing ? (
              <div className="space-y-2 text-stone-400">
                <Loader2 size={32} className="animate-spin mx-auto text-gold-500" />
                <p className="text-xs font-semibold uppercase tracking-wider font-mono">Salvando preços no banco...</p>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-850 flex items-center justify-center text-stone-400">
                  <Upload size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-stone-200">
                    Arraste seu arquivo CSV ou <span className="text-gold-500 underline cursor-pointer">clique aqui</span>
                  </p>
                  <p className="text-[10px] text-stone-500">
                    Apenas arquivos .csv contendo colunas de Código SKU e Novo Preço.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Erro de Arquivo */}
          {fileError && (
            <div className="p-3.5 bg-red-950/20 border border-red-900/30 rounded-lg text-xs text-red-400 leading-normal flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Resultado da Importação */}
          {importResult && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              importResult.success && importResult.skippedCount === 0
                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
                : 'bg-amber-950/20 border-amber-900/40 text-amber-400'
            }`}>
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                {importResult.success && importResult.skippedCount === 0 ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertTriangle size={16} />
                )}
                <span>Resultado do Processamento</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <p className="text-[10px] text-stone-400 font-sans uppercase">Importados com Sucesso</p>
                  <p className="text-lg font-bold text-stone-200 mt-0.5">{importResult.importedCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 font-sans uppercase">Ignorados / Pulados</p>
                  <p className={`text-lg font-bold mt-0.5 ${importResult.skippedCount > 0 ? 'text-amber-500' : 'text-stone-200'}`}>
                    {importResult.skippedCount}
                  </p>
                </div>
              </div>

              {importResult.skippedSkus.length > 0 && (
                <div className="space-y-1 pt-1.5 border-t border-stone-800/40">
                  <p className="text-[9px] uppercase font-bold text-stone-400 font-sans">
                    SKUs Não Encontrados ou com Preço Inválido:
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {importResult.skippedSkus.map((sku, idx) => (
                      <span key={idx} className="bg-stone-900 text-stone-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-stone-800">
                        {sku}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informações e Instruções */}
        <div className="bg-stone-850 border border-stone-800 rounded-xl p-6 shadow-soft space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-stone-300 tracking-wider uppercase flex items-center gap-2">
              <Info size={14} className="text-gold-500" />
              Instruções de Importação
            </h3>
            
            <div className="text-xs text-stone-400 space-y-3 leading-relaxed">
              <p>
                Para atualizar a tabela regional da UF selecionada, prepare um arquivo contendo as colunas SKU e o preço regional de atacado (preco).
              </p>
              
              <div className="bg-stone-900 border border-stone-800 rounded-lg p-3 space-y-2.5">
                <span className="text-[9px] font-bold font-mono text-gold-500 uppercase tracking-widest block border-b border-stone-800/60 pb-1">
                  Exemplo de CSV (.csv)
                </span>
                <pre className="font-mono text-[10px] text-stone-300 leading-normal">
                  sku;preco<br />
                  SKU-0001;49.90<br />
                  SKU-0002;120,50<br />
                  SKU-0003;R$ 69,90
                </pre>
              </div>

              <ul className="list-disc list-inside space-y-1.5 text-[11px] text-stone-400">
                <li>O SKU deve coincidir exatamente com o SKU cadastrado no vinho.</li>
                <li>Aceita formatos de moeda brasileira (com "R$", ponto de milhar e vírgula decimal).</li>
                <li>Os delimitadores aceitos no CSV são vírgula (<code className="text-stone-300 font-mono">,</code>) ou ponto-e-vírgula (<code className="text-stone-300 font-mono">;</code>).</li>
                <li>Se um SKU não estiver cadastrado no banco, ele será ignorado e listado nos logs.</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-stone-900/40 border border-stone-800 rounded-lg text-[10px] text-stone-500 italic leading-normal flex items-start gap-2">
            <Database size={13} className="shrink-0 mt-0.5 text-stone-600" />
            <span>
              Fallback ativo: se um vinho não tiver preço regional importado para a UF do cliente, o sistema automaticamente utilizará o preço nacional padrão cadastrado no rótulo.
            </span>
          </div>
        </div>

      </div>

      {/* Lista de Preços Ativos para a UF */}
      <div className="bg-stone-850 border border-stone-800 rounded-xl p-5 shadow-soft space-y-4">
        
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-stone-300 tracking-wider uppercase flex items-center gap-2">
              Preços Regionais Cadastrados - UF: {selectedUf}
            </h2>
            <p className="text-[10px] text-stone-500 mt-0.5">
              Lista de rótulos que possuem preço diferenciado nesta UF. Rótulos ocultos utilizam o preço padrão.
            </p>
          </div>

          {/* Barra de Pesquisa Local */}
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-500 pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Pesquisar por SKU, Vinho ou Produtor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-gold-500 transition-all"
            />
          </div>
        </div>

        {/* Tabela de Preços Regionais */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-stone-700">
          {loading ? (
            <div className="flex justify-center items-center py-12 gap-2 text-stone-400 text-xs">
              <Loader2 size={14} className="animate-spin text-gold-500" />
              <span>Buscando registros da região...</span>
            </div>
          ) : filteredPrices.length === 0 ? (
            <div className="text-center py-12 text-stone-500 space-y-2">
              <Database className="mx-auto h-8 w-8 stroke-[1.2] text-stone-600" />
              <p className="text-xs font-medium">Nenhum preço regional cadastrado para {selectedUf}.</p>
              <p className="text-[10px] text-stone-600">Todos os vinhos estão utilizando o preço nacional padrão.</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left text-stone-300">
              <thead>
                <tr className="border-b border-stone-800 text-stone-500 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Rótulo / Produtor</th>
                  <th className="py-3 px-4 text-center">Preço Padrão (Caixa)</th>
                  <th className="py-3 px-4 text-center">Preço Regional (UF: {selectedUf})</th>
                  <th className="py-3 px-4">Modificado Em</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/40">
                {filteredPrices.map((price) => {
                  const dataModificado = new Date(price.atualizado_em).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={price.id} className="hover:bg-stone-900/15 group transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-400">{price.sku}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-stone-200">{price.nome}</p>
                          <p className="text-[10px] text-stone-500 mt-0.5">{price.produtor}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-stone-400 font-mono">
                        R$ {(price.preco_nacional * price.caixa_fechada_qnt).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-gold-500 font-bold bg-gold-500/5">
                        R$ {(price.preco_regional * price.caixa_fechada_qnt).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-3 px-4 text-stone-400 font-mono">{dataModificado}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeletePrice(price.id)}
                          disabled={actionLoadingId === price.id}
                          className="text-stone-500 hover:text-red-400 p-1.5 rounded bg-stone-900 border border-stone-850 hover:border-red-900/40 hover:bg-red-950/10 transition-all cursor-pointer focus:outline-none"
                          title="Excluir preço regional (restaura padrão)"
                        >
                          {actionLoadingId === price.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
