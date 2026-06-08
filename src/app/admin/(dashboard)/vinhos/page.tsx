'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  fetchAdminWinesServer,
  toggleWineActiveServer,
  toggleWineFeaturedServer,
  updateWineOrderServer,
  deleteWineServer,
} from '@/app/actions/wines';
import type { Wine } from '@/types/wine';
import { ArrowDown, ArrowUp, Edit, Plus, Search, Trash2, Wine as WineIcon, Loader2 } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase-client';

export default function AdminWinesPage() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadWines = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminWinesServer();
      if (!res.error) {
        setWines(res.wines);
      }
    } catch (err) {
      console.error(err);
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

        if (profile.role !== 'admin') {
          // Redireciona representantes de volta para a home do admin
          window.location.href = '/admin';
          return;
        }

        setRole(profile.role);
        loadWines();
      } catch (err) {
        console.error('Error verifying admin permissions:', err);
        window.location.href = '/admin';
      }
    }

    checkPermissions();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setActionLoadingId(id);
    try {
      const res = await toggleWineActiveServer(id, !currentStatus);
      if (res.success) {
        setWines((prev) =>
          prev.map((w) => (w.id === id ? { ...w, ativo: !currentStatus } : w))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    setActionLoadingId(id);
    try {
      const res = await toggleWineFeaturedServer(id, !currentStatus);
      if (res.success) {
        setWines((prev) =>
          prev.map((w) => (w.id === id ? { ...w, destaque: !currentStatus } : w))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateOrder = async (id: string, currentOrder: number, delta: number) => {
    const newOrder = currentOrder + delta;
    if (newOrder < 0) return;
    setActionLoadingId(id);
    try {
      const res = await updateWineOrderServer(id, newOrder);
      if (res.success) {
        setWines((prev) =>
          prev.map((w) => (w.id === id ? { ...w, ordem: newOrder } : w))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    const confirmed = window.confirm(
      `Excluir Vinho: Tem certeza de que deseja excluir permanentemente o vinho "${nome}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setActionLoadingId(id);
    try {
      const res = await deleteWineServer(id);
      if (res.success) {
        setWines((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtragem local baseada na busca
  const filteredWines = wines.filter((w) => {
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return (
      w.nome.toLowerCase().includes(s) ||
      w.produtor.toLowerCase().includes(s) ||
      (w.pais && w.pais.toLowerCase().includes(s)) ||
      (w.regiao && w.regiao.toLowerCase().includes(s))
    );
  });

  if (!role) {
    return (
      <div className="py-32 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-allvino-500 h-5 w-5" />
        Verificando permissões de acesso...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-stone-200 font-sans">
      {/* Topo com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-stone-50 tracking-wider uppercase">Vinhos do Catálogo</h1>
          <p className="text-xs text-stone-400 mt-1">
            Cadastre, edite, altere a ordenação e controle a visibilidade do portfólio.
          </p>
        </div>

        <Link
          href="/admin/vinhos/novo"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-allvino-500 hover:bg-allvino-600 active:bg-allvino-500 text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 select-none shadow-lift"
        >
          <Plus size={14} />
          Novo Vinho
        </Link>
      </div>

      {/* Barra de Busca */}
      <div className="bg-stone-850 border border-stone-800 rounded-xl p-4 shadow-soft flex items-center gap-3 focus-within:border-gold-500/20 transition-all duration-300">
        <span className="text-stone-500">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome, produtor, uva ou país..."
          className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition-all"
        />
      </div>

      {/* Tabela de Vinhos */}
      <div className="bg-stone-850 border border-stone-800 rounded-xl overflow-hidden shadow-soft">
        {loading ? (
          <div className="py-20 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-allvino-500 h-5 w-5" />
            Carregando vinhos...
          </div>
        ) : filteredWines.length === 0 ? (
          <div className="py-20 text-center px-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500 mx-auto mb-4">
              <WineIcon size={22} className="stroke-[1.2]" />
            </div>
            <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Nenhum vinho cadastrado</h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Comece adicionando o primeiro rótulo ao seu catálogo clicando no botão acima.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-stone-700">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-850 text-[9px] font-bold text-stone-400 uppercase tracking-wider select-none">
                  <th className="py-4 px-6 w-16">Rótulo</th>
                  <th className="py-4 px-6">Nome / Produtor</th>
                  <th className="py-4 px-6">Região / País</th>
                  <th className="py-4 px-6">Tipo / Safra</th>
                  <th className="py-4 px-6 text-right">Preço Unitário</th>
                  <th className="py-4 px-6 text-center">Ordem</th>
                  <th className="py-4 px-6 text-center">Destaque</th>
                  <th className="py-4 px-6 text-center">Ativo</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/40 text-xs text-stone-300">
                {filteredWines.map((w) => {
                  const isActionLoading = actionLoadingId === w.id;

                  return (
                    <tr key={w.id} className="hover:bg-stone-900/10 transition-colors">
                      {/* Imagem */}
                      <td className="py-3 px-6">
                        <div className="w-10 h-14 bg-stone-900 border border-stone-800 rounded overflow-hidden flex items-center justify-center text-stone-400 flex-shrink-0 relative shadow-sm">
                          {w.imagem_url ? (
                            <img
                              src={w.imagem_url}
                              alt={w.nome}
                              className="object-contain w-full h-full p-0.5"
                            />
                          ) : (
                            <WineIcon size={14} className="stroke-[1.2] text-stone-300" />
                          )}
                        </div>
                      </td>

                      {/* Nome/Produtor */}
                      <td className="py-3 px-6">
                        <div className="font-semibold text-stone-100 max-w-[200px] truncate">
                          {w.nome}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate max-w-[200px] mt-0.5">
                          {w.produtor}
                        </div>
                      </td>

                      {/* Região/País */}
                      <td className="py-3 px-6">
                        <div className="text-stone-200">{w.regiao || '-'}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">{w.pais}</div>
                      </td>

                      {/* Tipo/Safra */}
                      <td className="py-3 px-6">
                        <div className="text-stone-200">{w.tipo}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          {w.safra ? `Safra ${w.safra}` : 'N/A'}
                        </div>
                      </td>

                      {/* Preço */}
                      <td className="py-3 px-6 text-right font-bold font-display text-gold-400">
                        {w.preco_atacado.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>

                      {/* Ordem */}
                      <td className="py-3 px-6">
                        <div className="flex items-center justify-center gap-1 select-none">
                          <button
                            type="button"
                            disabled={isActionLoading || w.ordem === 0}
                            onClick={() => handleUpdateOrder(w.id, w.ordem, -1)}
                            className="p-1.5 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-50 hover:border-stone-700 disabled:opacity-30 transition-all duration-200"
                          >
                            <ArrowUp size={11} />
                          </button>
                          <span className="w-6 text-center text-[10px] font-mono font-semibold text-stone-300">
                            {w.ordem}
                          </span>
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleUpdateOrder(w.id, w.ordem, 1)}
                            className="p-1.5 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-50 hover:border-stone-700 disabled:opacity-30 transition-all duration-200"
                          >
                            <ArrowDown size={11} />
                          </button>
                        </div>
                      </td>

                      {/* Destaque */}
                      <td className="py-3 px-6 text-center">
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleToggleFeatured(w.id, w.destaque)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none shadow-inner ${
                            w.destaque ? 'bg-allvino-500' : 'bg-stone-900 border border-stone-800'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                              w.destaque ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Ativo */}
                      <td className="py-3 px-6 text-center">
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleToggleActive(w.id, w.ativo)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none shadow-inner ${
                            w.ativo ? 'bg-emerald-600' : 'bg-stone-900 border border-stone-800'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                              w.ativo ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2.5 select-none">
                          <Link
                            href={`/admin/vinhos/${w.id}`}
                            className="p-1.5 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-gold-500 hover:border-stone-700 transition-colors"
                          >
                            <Edit size={12} />
                          </Link>
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleDelete(w.id, w.nome)}
                            className="p-1.5 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-red-400 hover:border-stone-700 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
