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
import { ArrowDown, ArrowUp, Edit, Plus, Search, Trash2, Wine as WineIcon } from 'lucide-react';

export default function AdminWinesPage() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
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
    loadWines();
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

  return (
    <div className="space-y-6">
      {/* Topo com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide uppercase">Vinhos do Catálogo</h1>
          <p className="text-xs text-gray-400 mt-1">
            Cadastre, edite, altere a ordenação e controle a visibilidade do portfólio.
          </p>
        </div>

        <Link
          href="/admin/vinhos/novo"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#A61C3C] hover:bg-[#85162F] text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 select-none shadow-md"
        >
          <Plus size={14} />
          Novo Vinho
        </Link>
      </div>

      {/* Barra de Busca */}
      <div className="bg-[#1A1617] border border-gray-800/60 rounded-xl p-4 shadow-md flex items-center gap-3">
        <span className="text-gray-500">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome, produtor, uva ou país..."
          className="w-full bg-[#0B090A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#A61C3C] transition-all"
        />
      </div>

      {/* Tabela de Vinhos */}
      <div className="bg-[#1A1617] border border-gray-800/60 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 text-center text-gray-500 text-sm flex flex-col items-center gap-3">
            <span className="animate-spin text-[#A61C3C] text-xl font-semibold">|</span>
            Carregando vinhos...
          </div>
        ) : filteredWines.length === 0 ? (
          <div className="py-20 text-center px-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500 mx-auto mb-4">
              <WineIcon size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">Nenhum vinho cadastrado</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Comece adicionando o primeiro rótulo ao seu catálogo clicando no botão acima.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-[#1A1617] text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                  <th className="py-4 px-6 w-16">Rótulo</th>
                  <th className="py-4 px-6">Nome / Produtor</th>
                  <th className="py-4 px-6">Região / País</th>
                  <th className="py-4 px-6">Tipo / Safra</th>
                  <th className="py-4 px-6 text-right">Preço Atacado</th>
                  <th className="py-4 px-6 text-center">Ordem</th>
                  <th className="py-4 px-6 text-center">Destaque</th>
                  <th className="py-4 px-6 text-center">Ativo</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-sm text-gray-300">
                {filteredWines.map((w) => {
                  const isActionLoading = actionLoadingId === w.id;

                  return (
                    <tr key={w.id} className="hover:bg-[#0B090A]/30 transition-colors">
                      {/* Imagem */}
                      <td className="py-3 px-6">
                        <div className="w-10 h-14 bg-gray-900 border border-gray-800 rounded overflow-hidden flex items-center justify-center text-gray-700 flex-shrink-0 relative">
                          {w.imagem_url ? (
                            <img
                              src={w.imagem_url}
                              alt={w.nome}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <WineIcon size={16} />
                          )}
                        </div>
                      </td>

                      {/* Nome/Produtor */}
                      <td className="py-3 px-6">
                        <div className="font-semibold text-gray-100 max-w-[200px] truncate">
                          {w.nome}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {w.produtor}
                        </div>
                      </td>

                      {/* Região/País */}
                      <td className="py-3 px-6">
                        <div className="text-gray-200">{w.regiao || '-'}</div>
                        <div className="text-xs text-gray-500">{w.pais}</div>
                      </td>

                      {/* Tipo/Safra */}
                      <td className="py-3 px-6">
                        <div className="text-gray-200">{w.tipo}</div>
                        <div className="text-xs text-gray-500">
                          {w.safra ? `Safra ${w.safra}` : 'N/A'}
                        </div>
                      </td>

                      {/* Preço */}
                      <td className="py-3 px-6 text-right font-bold text-gray-100">
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
                            className="p-1 rounded bg-[#0B090A] border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-semibold text-gray-300">
                            {w.ordem}
                          </span>
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleUpdateOrder(w.id, w.ordem, 1)}
                            className="p-1 rounded bg-[#0B090A] border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Destaque */}
                      <td className="py-3 px-6 text-center">
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleToggleFeatured(w.id, w.destaque)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${
                            w.destaque ? 'bg-[#A61C3C]' : 'bg-gray-800'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
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
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${
                            w.ativo ? 'bg-green-600' : 'bg-gray-800'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              w.ativo ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-3 select-none">
                          <Link
                            href={`/admin/vinhos/${w.id}`}
                            className="p-1.5 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-[#A61C3C] transition-colors"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleDelete(w.id, w.nome)}
                            className="p-1.5 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-[#EF4444] transition-colors"
                          >
                            <Trash2 size={14} />
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
