import { createServerSupabase } from '@/lib/supabase';
import { logoutAction } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { 
  BarChart3, 
  Database, 
  FileText, 
  LogOut, 
  PlusCircle, 
  Wine, 
  Eye, 
  Download, 
  History,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { fetchAnalyticsDashboardAction } from '@/app/actions/analytics';

export default async function AdminPage() {
  const supabase = createServerSupabase();

  // Queries básicas para obter estatísticas do catálogo no Supabase
  const [
    { count: totalWines },
    { count: activeWines },
    { count: featuredWines },
    analyticsResponse
  ] = await Promise.all([
    supabase.from('wines').select('*', { count: 'exact', head: true }),
    supabase.from('wines').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('wines').select('*', { count: 'exact', head: true }).eq('destaque', true),
    fetchAnalyticsDashboardAction()
  ]);

  const analytics = analyticsResponse?.data || {
    ranking: [],
    history: [],
    totals: { clicks: 0, downloads: 0, orcamentos: 0 }
  };

  return (
    <div className="space-y-8 animate-fade-in text-gray-100">
      {/* Bloco de Boas Vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Painel Administrativo</h1>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie o catálogo de vinhos, orçamentos gerados e métricas de engajamento B2B.
          </p>
        </div>

        {/* Botão de Logout */}
        <form action={async () => {
          'use server';
          await logoutAction();
          redirect('/admin/login');
        }}>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 border border-gray-800 hover:border-red-900/60 hover:bg-red-950/20 text-gray-400 hover:text-[#EF4444] rounded-lg text-sm font-medium transition-all select-none focus:outline-none"
          >
            <LogOut size={16} />
            Sair do Painel
          </button>
        </form>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Vinhos */}
        <div className="bg-[#1A1617] border border-gray-800/60 rounded-xl p-5 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Vinhos Cadastrados</p>
            <p className="text-2xl font-extrabold text-white">{totalWines ?? 0}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-300">
            <Wine size={18} />
          </div>
        </div>

        {/* Card 2: Visualizações */}
        <div className="bg-[#1A1617] border border-gray-800/60 rounded-xl p-5 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Visualizações</p>
            <p className="text-2xl font-extrabold text-blue-400">{analytics.totals.clicks}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950/10 border border-blue-900/30 flex items-center justify-center text-blue-400">
            <Eye size={18} />
          </div>
        </div>

        {/* Card 3: Downloads de PDFs */}
        <div className="bg-[#1A1617] border border-gray-800/60 rounded-xl p-5 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Downloads Rótulo</p>
            <p className="text-2xl font-extrabold text-amber-400">{analytics.totals.downloads}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-950/10 border border-amber-900/30 flex items-center justify-center text-amber-400">
            <Download size={18} />
          </div>
        </div>

        {/* Card 4: Orçamentos Catalogados */}
        <div className="bg-[#1A1617] border border-gray-800/60 rounded-xl p-5 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Orçamentos Gerados</p>
            <p className="text-2xl font-extrabold text-[#A61C3C]">{analytics.totals.orcamentos}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#A61C3C]/10 border border-[#A61C3C]/20 flex items-center justify-center text-[#A61C3C]">
            <History size={18} />
          </div>
        </div>
      </div>

      {/* Seção de Ações Rápidas */}
      <div className="bg-[#1A1617] border border-gray-800/60 rounded-xl p-6 shadow-lg">
        <h2 className="text-sm font-bold text-gray-200 mb-4 tracking-wide uppercase">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link 
            href="/admin/vinhos/novo"
            className="p-4 border border-gray-800 rounded-lg bg-[#0B090A]/50 hover:bg-[#0B090A] hover:border-gray-700 transition-all cursor-pointer flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded bg-[#A61C3C]/10 text-[#A61C3C] flex items-center justify-center flex-shrink-0">
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">Novo Vinho</h3>
              <p className="text-xs text-gray-400 mt-1">
                Adicione um novo rótulo ao catálogo B2B (Fase 2).
              </p>
            </div>
          </Link>

          <Link 
            href="/admin/vinhos"
            className="p-4 border border-gray-800 rounded-lg bg-[#0B090A]/50 hover:bg-[#0B090A] hover:border-gray-700 transition-all cursor-pointer flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded bg-gray-900 text-gray-300 flex items-center justify-center flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">Ver Catálogo</h3>
              <p className="text-xs text-gray-400 mt-1">
                Visualizar a listagem completa e gerenciar ativos, destaques e ordem.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Grid de Analytics e Histórico */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Coluna 1: Ranking de Vinhos (Popularidade) */}
        <div className="xl:col-span-1 bg-[#1A1617] border border-gray-800/60 rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-[#A61C3C] h-5 w-5" />
            <h2 className="text-sm font-bold text-gray-200 tracking-wide uppercase">Rótulos Populares (Top 10)</h2>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            {analytics.ranking.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">Nenhum evento registrado ainda.</p>
            ) : (
              <table className="w-full text-xs text-left text-gray-300">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 font-semibold">
                    <th className="py-2">Vinho</th>
                    <th className="py-2 text-center">Vis</th>
                    <th className="py-2 text-center">Pdfs</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {analytics.ranking.slice(0, 10).map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-gray-800/20">
                      <td className="py-2.5 max-w-[150px] truncate">
                        <span className="text-gray-500 mr-1.5 font-mono">{idx + 1}.</span>
                        <span className="font-medium text-gray-200">{item.nome}</span>
                        <span className="block text-[10px] text-gray-400 truncate">{item.produtor}</span>
                      </td>
                      <td className="py-2.5 text-center text-blue-400 font-medium">{item.clicks}</td>
                      <td className="py-2.5 text-center text-amber-400 font-medium">{item.downloads}</td>
                      <td className="py-2.5 text-right font-bold text-white">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Coluna 2: Histórico Recente de PDFs */}
        <div className="xl:col-span-2 bg-[#1A1617] border border-gray-800/60 rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="text-green-500 h-5 w-5" />
            <h2 className="text-sm font-bold text-gray-200 tracking-wide uppercase">Histórico de Orçamentos Gerados</h2>
          </div>

          <div className="flex-1 overflow-x-auto">
            {analytics.history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <FileText className="h-8 w-8 stroke-[1.5] mb-2" />
                <p className="text-xs">Nenhum orçamento exportado por representantes ainda.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left text-gray-300">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 font-semibold">
                    <th className="py-2">Cliente</th>
                    <th className="py-2">Representante</th>
                    <th className="py-2 text-center">Itens</th>
                    <th className="py-2">Data</th>
                    <th className="py-2 text-right">Mídia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {analytics.history.map((log: any) => {
                    const data = new Date(log.criado_em).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const wineCount = Array.isArray(log.vinhos_selecionados) ? log.vinhos_selecionados.length : 0;
                    return (
                      <tr key={log.id} className="hover:bg-gray-800/20">
                        <td className="py-2.5">
                          <p className="font-semibold text-gray-200">{log.cliente_nome}</p>
                          {log.cliente_whatsapp && (
                            <span className="text-[10px] text-gray-400 font-mono">{log.cliente_whatsapp}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-gray-300">{log.representative_nome}</td>
                        <td className="py-2.5 text-center text-rose-400 font-bold">{wineCount}</td>
                        <td className="py-2.5 text-gray-400 font-mono">{data}</td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex items-center gap-1 rounded bg-[#A61C3C]/10 text-[#A61C3C] text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider">
                            PDF
                          </span>
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
    </div>
  );
}
