import { createServerSupabase } from '@/lib/supabase';
import { logoutAction } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { BarChart3, Database, FileText, LogOut, PlusCircle, Wine } from 'lucide-react';

export default async function AdminPage() {
  const supabase = createServerSupabase();

  // Queries básicas para obter estatísticas do catálogo no Supabase
  const [
    { count: totalWines },
    { count: activeWines },
    { count: featuredWines }
  ] = await Promise.all([
    supabase.from('wines').select('*', { count: 'exact', head: true }),
    supabase.from('wines').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('wines').select('*', { count: 'exact', head: true }).eq('destaque', true)
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Bloco de Boas Vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Painel Administrativo</h1>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie o catálogo de vinhos e configure as exportações B2B.
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card 1: Total de Vinhos */}
        <div className="bg-[#1A1617] border border-gray-800/60 rounded-xl p-6 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Total de Vinhos</p>
            <p className="text-3xl font-extrabold text-white">{totalWines ?? 0}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-300">
            <Wine size={22} />
          </div>
        </div>

        {/* Card 2: Vinhos Ativos */}
        <div className="bg-[#1A1617] border border-gray-800/60 rounded-xl p-6 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Catálogo Ativo</p>
            <p className="text-3xl font-extrabold text-green-400">{activeWines ?? 0}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-green-950/10 border border-green-900/30 flex items-center justify-center text-green-400">
            <Database size={22} />
          </div>
        </div>

        {/* Card 3: Destaques da Semana */}
        <div className="bg-[#1A1617] border border-gray-800/60 rounded-xl p-6 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Destaques da Semana</p>
            <p className="text-3xl font-extrabold text-amber-400">{featuredWines ?? 0}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-950/10 border border-amber-900/30 flex items-center justify-center text-amber-400">
            <BarChart3 size={22} />
          </div>
        </div>
      </div>

      {/* Seção de Ações Rápidas */}
      <div className="bg-[#1A1617] border border-gray-800/60 rounded-xl p-6 shadow-lg">
        <h2 className="text-base font-bold text-gray-200 mb-4 tracking-wide uppercase">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-800 rounded-lg bg-[#0B090A]/50 hover:bg-[#0B090A] hover:border-gray-700 transition-all cursor-pointer flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-[#A61C3C]/10 text-[#A61C3C] flex items-center justify-center flex-shrink-0">
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">Novo Vinho</h3>
              <p className="text-xs text-gray-400 mt-1">
                Adicione um novo rótulo ao catálogo B2B (Fase 2).
              </p>
            </div>
          </div>

          <div className="p-4 border border-gray-800 rounded-lg bg-[#0B090A]/50 hover:bg-[#0B090A] hover:border-gray-700 transition-all cursor-pointer flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-gray-900 text-gray-300 flex items-center justify-center flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">Ver Catálogo</h3>
              <p className="text-xs text-gray-400 mt-1">
                Visualizar a listagem completa e exportar PDF ou WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
