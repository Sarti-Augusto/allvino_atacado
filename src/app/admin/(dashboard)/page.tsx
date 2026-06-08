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
  UserCheck,
  ExternalLink,
  Users,
  Palette
} from 'lucide-react';
import Link from 'next/link';
import { fetchAnalyticsDashboardAction } from '@/app/actions/analytics';

export default async function AdminPage() {
  const supabase = createServerSupabase();

  // 1. Obter usuário logado e verificar perfil
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('admin_users')
    .select('ativo, role, nome')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.ativo) redirect('/admin/login');

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
    <div className="space-y-8 animate-fade-in text-stone-200 font-sans">
      {/* Bloco de Boas Vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-50 tracking-display uppercase">
            {profile.role === 'admin' ? 'Painel do Administrador' : 'Portal do Representante'}
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            {profile.role === 'admin' 
              ? 'Gerencie o catálogo de vinhos, orçamentos gerados e métricas de engajamento B2B.'
              : 'Acompanhe seus orçamentos compartilhados e a popularidade dos rótulos do catálogo.'}
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
            className="flex items-center gap-2 px-4 py-2 border border-stone-850 hover:border-red-900/60 hover:bg-red-950/20 text-stone-400 hover:text-red-400 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 select-none focus:outline-none"
          >
            <LogOut size={14} />
            Sair do Portal
          </button>
        </form>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Vinhos */}
        <div className="bg-stone-850 border border-stone-800 rounded-xl p-5 flex items-center justify-between shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Vinhos no Catálogo</p>
            <p className="font-display text-2xl font-semibold text-stone-50">{totalWines ?? 0}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300">
            <Wine size={16} />
          </div>
        </div>

        {/* Card 2: Visualizações */}
        <div className="bg-stone-850 border border-stone-800 rounded-xl p-5 flex items-center justify-between shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Visualizações</p>
            <p className="font-display text-2xl font-semibold text-blue-400">{analytics.totals.clicks}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950/10 border border-blue-900/30 flex items-center justify-center text-blue-400">
            <Eye size={16} />
          </div>
        </div>

        {/* Card 3: Downloads de PDFs */}
        <div className="bg-stone-850 border border-stone-800 rounded-xl p-5 flex items-center justify-between shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Downloads Rótulo</p>
            <p className="font-display text-2xl font-semibold text-gold-400">{analytics.totals.downloads}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gold-900/10 border border-gold-900/30 flex items-center justify-center text-gold-500">
            <Download size={16} />
          </div>
        </div>

        {/* Card 4: Orçamentos Catalogados */}
        <div className="bg-stone-850 border border-stone-800 rounded-xl p-5 flex items-center justify-between shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
              {profile.role === 'admin' ? 'Orçamentos Gerais' : 'Meus Orçamentos'}
            </p>
            <p className="font-display text-2xl font-semibold text-allvino-400">{analytics.totals.orcamentos}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-allvino-500/10 border border-allvino-500/20 flex items-center justify-center text-allvino-500">
            <History size={16} />
          </div>
        </div>
      </div>

      {/* Seção de Ações Rápidas */}
      <div className="bg-stone-850 border border-stone-800 rounded-xl p-6 shadow-soft">
        <h2 className="text-xs font-bold text-stone-300 mb-4 tracking-wider uppercase">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {profile.role === 'admin' ? (
            <>
              <Link 
                href="/admin/vinhos/novo"
                className="p-4 border border-stone-800 rounded-lg bg-stone-900/50 hover:bg-stone-900 hover:border-gold-500/20 transition-all cursor-pointer flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded bg-allvino-500/10 text-allvino-500 flex items-center justify-center flex-shrink-0">
                  <PlusCircle size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Novo Vinho</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Adicione um novo rótulo ao catálogo B2B.
                  </p>
                </div>
              </Link>

              <Link 
                href="/admin/vinhos"
                className="p-4 border border-stone-800 rounded-lg bg-stone-900/50 hover:bg-stone-900 hover:border-gold-500/20 transition-all cursor-pointer flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded bg-stone-800 text-stone-300 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Ver Catálogo</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Visualizar a listagem completa.
                  </p>
                </div>
              </Link>

              <Link 
                href="/admin/precos"
                className="p-4 border border-stone-800 rounded-lg bg-stone-900/50 hover:bg-stone-900 hover:border-gold-500/20 transition-all cursor-pointer flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded bg-stone-850 border border-stone-800 text-stone-300 hover:border-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Preços por UF</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Importe e gerencie preços customizados por região.
                  </p>
                </div>
              </Link>

              <Link 
                href="/admin/representantes"
                className="p-4 border border-stone-800 rounded-lg bg-stone-900/50 hover:bg-stone-900 hover:border-gold-500/20 transition-all cursor-pointer flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded bg-gold-500/10 text-gold-500 flex items-center justify-center flex-shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Representantes</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Cadastre e gerencie representantes e UFs.
                  </p>
                </div>
              </Link>

              <Link 
                href="/admin/configuracao"
                className="p-4 border border-stone-800 rounded-lg bg-stone-900/50 hover:bg-stone-900 hover:border-gold-500/20 transition-all cursor-pointer flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded bg-stone-850 border border-stone-800 text-stone-300 hover:border-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <Palette size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Design PDF</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Ajuste o template da capa e cores do PDF.
                  </p>
                </div>
              </Link>
            </>
          ) : (
            <Link 
              href="/"
              className="p-4 border border-stone-800 rounded-lg bg-stone-900/50 hover:bg-stone-900 hover:border-gold-500/20 transition-all cursor-pointer flex items-start gap-4 sm:col-span-2 lg:col-span-4"
            >
              <div className="w-10 h-10 rounded bg-gold-500/10 text-gold-500 flex items-center justify-center flex-shrink-0">
                <Wine size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Ir para o Catálogo de Vendas</h3>
                <p className="text-xs text-stone-400 mt-1">
                  Acesse a página principal para selecionar vinhos, montar orçamentos personalizados e compartilhar com seus clientes.
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Grid de Analytics e Histórico */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Coluna 1: Ranking de Vinhos (Popularidade) */}
        <div className="xl:col-span-1 bg-stone-850 border border-stone-800 rounded-xl p-5 shadow-soft flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-allvino-500 h-4.5 w-4.5" />
            <h2 className="text-xs font-bold text-stone-200 tracking-wider uppercase">Rótulos Populares (Top 10)</h2>
          </div>
          
          <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-stone-700">
            {analytics.ranking.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-8">Nenhum evento registrado ainda.</p>
            ) : (
              <table className="w-full text-xs text-left text-stone-300">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-500 font-bold uppercase text-[9px] tracking-wider">
                    <th className="py-2">Vinho</th>
                    <th className="py-2 text-center">Vis</th>
                    <th className="py-2 text-center">Pdfs</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/40">
                  {analytics.ranking.slice(0, 10).map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-stone-900/10">
                      <td className="py-2.5 max-w-[150px] truncate">
                        <span className="text-stone-500 mr-1 font-mono">{idx + 1}.</span>
                        <span className="font-semibold text-stone-200">{item.nome}</span>
                        <span className="block text-[9px] text-stone-500 truncate">{item.produtor}</span>
                      </td>
                      <td className="py-2.5 text-center text-blue-400 font-bold">{item.clicks}</td>
                      <td className="py-2.5 text-center text-gold-500 font-bold">{item.downloads}</td>
                      <td className="py-2.5 text-right font-bold text-stone-50">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Coluna 2: Histórico Recente de PDFs */}
        <div className="xl:col-span-2 bg-stone-850 border border-stone-800 rounded-xl p-5 shadow-soft flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="text-emerald-500 h-4.5 w-4.5" />
            <h2 className="text-xs font-bold text-stone-200 tracking-wider uppercase">
              {profile.role === 'admin' ? 'Histórico Geral de Orçamentos' : 'Meus Orçamentos Recentes'}
            </h2>
          </div>

          <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-stone-700">
            {analytics.history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-stone-500">
                <FileText className="h-8 w-8 stroke-[1.2] mb-2 text-stone-600" />
                <p className="text-xs">Nenhum orçamento gerado ainda.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left text-stone-300">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-500 font-bold uppercase text-[9px] tracking-wider">
                    <th className="py-2">Cliente</th>
                    <th className="py-2">Representante</th>
                    <th className="py-2 text-center">Itens</th>
                    <th className="py-2">Data</th>
                    <th className="py-2 text-right">Mídia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/40">
                  {analytics.history.map((log: any) => {
                    const data = new Date(log.criado_em).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const wineCount = Array.isArray(log.vinhos_selecionados) ? log.vinhos_selecionados.length : 0;
                    return (
                      <tr key={log.id} className="hover:bg-stone-900/10">
                        <td className="py-2.5">
                          <p className="font-semibold text-stone-200">{log.cliente_nome}</p>
                          {log.cliente_whatsapp && (
                            <span className="text-[9px] text-stone-500 font-mono">{log.cliente_whatsapp}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-stone-300">{log.representative_nome}</td>
                        <td className="py-2.5 text-center text-allvino-400 font-bold">{wineCount}</td>
                        <td className="py-2.5 text-stone-400 font-mono">{data}</td>
                        <td className="py-2.5 text-right">
                          {log.pdf_url ? (
                            <a
                              href={log.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 text-[10px] px-2 py-1 font-bold uppercase tracking-wider transition-colors"
                            >
                              <ExternalLink size={10} />
                              Ver PDF
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-stone-800 text-stone-500 text-[10px] px-2 py-1 font-bold uppercase tracking-wider">
                              PDF local
                            </span>
                          )}
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
