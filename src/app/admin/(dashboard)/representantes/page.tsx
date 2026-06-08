'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Trash2, 
  Plus, 
  X, 
  Loader2, 
  Shield, 
  Briefcase, 
  Calendar, 
  FileText, 
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  UserPlus
} from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase-client';
import { 
  fetchRepresentativesAction, 
  toggleRepresentativeActiveAction, 
  createRepresentativeAction, 
  deleteRepresentativeAction,
  updateRepresentativeUfsAction,
  type Representative 
} from '@/app/actions/representatives';

const ESTADOS_UF = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function RepresentativesPage() {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // States para Ações (Loading individual e confirmações)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // States do Modal de Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNome, setModalNome] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalRole, setModalRole] = useState<'admin' | 'representante'>('representante');
  const [modalUfs, setModalUfs] = useState<string[]>([]);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // States do Modal de Edição de UFs
  const [editingRep, setEditingRep] = useState<Representative | null>(null);
  const [editUfs, setEditUfs] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  // Status/Toast Geral
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchRepresentativesAction();
      if (res.error) {
        showToast('error', res.error);
      } else if (res.representatives) {
        setRepresentatives(res.representatives);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Erro inesperado ao carregar dados dos representantes.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
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

        setCurrentUserId(session.user.id);

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
          // Redireciona representantes comuns de volta para o painel principal
          window.location.href = '/admin';
          return;
        }

        setRole(profile.role);
        loadData();
      } catch (err) {
        console.error('Error verifying permissions:', err);
        window.location.href = '/admin';
      }
    }

    checkPermissions();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setActionLoadingId(id);
    try {
      const res = await toggleRepresentativeActiveAction(id, !currentStatus);
      if (res.error) {
        showToast('error', res.error);
      } else {
        setRepresentatives((prev) =>
          prev.map((rep) => (rep.id === id ? { ...rep, ativo: !currentStatus } : rep))
        );
        showToast('success', `Status do representante atualizado para ${!currentStatus ? 'Ativo' : 'Inativo'}.`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Erro ao alterar status do representante.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await deleteRepresentativeAction(id);
      if (res.error) {
        showToast('error', res.error);
      } else {
        setRepresentatives((prev) => prev.filter((rep) => rep.id !== id));
        showToast('success', 'Representante excluído com sucesso.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Erro ao excluir representante.');
    } finally {
      setActionLoadingId(null);
      setDeleteConfirmId(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      const res = await createRepresentativeAction({
        nome: modalNome,
        email: modalEmail,
        password: modalPassword,
        role: modalRole,
        ufs: modalUfs
      });

      if (res.error) {
        setModalError(res.error);
      } else {
        // Fechar modal, limpar inputs e recarregar dados
        setIsModalOpen(false);
        setModalNome('');
        setModalEmail('');
        setModalPassword('');
        setModalRole('representante');
        setModalUfs([]);
        showToast('success', 'Novo representante cadastrado com sucesso!');
        loadData();
      }
    } catch (err: any) {
      setModalError(err?.message || 'Erro inesperado ao realizar cadastro.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateUfs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRep) return;
    setEditLoading(true);
    try {
      const res = await updateRepresentativeUfsAction(editingRep.id, editUfs);
      if (res.error) {
        showToast('error', res.error);
      } else {
        setRepresentatives((prev) =>
          prev.map((rep) => (rep.id === editingRep.id ? { ...rep, ufs: editUfs } : rep))
        );
        showToast('success', `Regiões do representante atualizadas com sucesso.`);
        setEditingRep(null);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Erro ao atualizar regiões do representante.');
    } finally {
      setEditLoading(false);
    }
  };

  // Filtragem dinâmica por nome/email
  const filteredReps = representatives.filter((rep) => {
    const term = search.toLowerCase();
    return (
      rep.nome.toLowerCase().includes(term) || 
      rep.email.toLowerCase().includes(term)
    );
  });

  // Estatísticas Rápidas
  const totalReps = representatives.filter(r => r.role === 'representante').length;
  const totalAdmins = representatives.filter(r => r.role === 'admin' || r.role === 'owner').length;
  const totalBudgets = representatives.reduce((sum, r) => sum + r.budgets_count, 0);

  if (loading && representatives.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-24 text-stone-400 gap-4">
        <Loader2 size={36} className="animate-spin text-allvino-500" />
        <p className="text-xs uppercase tracking-widest font-semibold font-mono">Carregando painel de gestão...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-stone-200 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed bottom-5 right-5 p-4 rounded-xl border z-50 flex items-center gap-3 shadow-2xl transition-all duration-300 max-w-sm ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-800 text-emerald-400' 
            : 'bg-red-950/90 border-red-800 text-red-400'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
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
            <span className="text-[10px] uppercase font-bold tracking-wider text-gold-500">Representantes</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-stone-50 tracking-display uppercase">
            Gestão de Representantes
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Cadastre novos usuários representantes, controle o status de acesso e veja métricas de orçamento por vendedor.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-allvino-500 hover:bg-allvino-600 active:bg-allvino-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 select-none shadow-lift hover:shadow-lift/10 focus:outline-none"
        >
          <UserPlus size={14} />
          Cadastrar Novo
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-stone-850 border border-stone-800 rounded-xl p-5 flex items-center justify-between shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Representantes Ativos</p>
            <p className="font-display text-2xl font-semibold text-stone-50">{totalReps}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300">
            <Users size={16} />
          </div>
        </div>

        <div className="bg-stone-850 border border-stone-800 rounded-xl p-5 flex items-center justify-between shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Administradores</p>
            <p className="font-display text-2xl font-semibold text-gold-500">{totalAdmins}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gold-900/10 border border-gold-900/30 flex items-center justify-center text-gold-500">
            <Shield size={16} />
          </div>
        </div>

        <div className="bg-stone-850 border border-stone-800 rounded-xl p-5 flex items-center justify-between shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Orçamentos Totais</p>
            <p className="font-display text-2xl font-semibold text-emerald-500">{totalBudgets}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/10 border border-emerald-900/30 flex items-center justify-center text-emerald-500">
            <FileText size={16} />
          </div>
        </div>
      </div>

      {/* Caixa de Busca e Tabela */}
      <div className="bg-stone-850 border border-stone-800 rounded-xl p-5 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <h2 className="text-xs font-bold text-stone-300 tracking-wider uppercase flex items-center gap-2">
            Lista de Acessos
          </h2>

          {/* Barra de Pesquisa */}
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-500 pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-gold-500 transition-all"
            />
          </div>
        </div>

        {/* Tabela de Representantes */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-stone-700">
          {filteredReps.length === 0 ? (
            <div className="text-center py-12 text-stone-500 space-y-2">
              <Users className="mx-auto h-8 w-8 stroke-[1.2] text-stone-600" />
              <p className="text-xs font-medium">Nenhum representante encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left text-stone-300">
              <thead>
                <tr className="border-b border-stone-800 text-stone-500 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4 text-center">Cargo</th>
                  <th className="py-3 px-4 text-center">UFs Ativas</th>
                  <th className="py-3 px-4 text-center">Orçamentos</th>
                  <th className="py-3 px-4">Cadastro</th>
                  <th className="py-3 px-4 text-center">Acesso Ativo</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/40">
                {filteredReps.map((rep) => {
                  const dataCadastro = new Date(rep.criado_em).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });

                  // Estilos dos Badges de Cargo
                  let roleBadge = 'text-stone-400 bg-stone-800 border-stone-700/30';
                  if (rep.role === 'owner') roleBadge = 'text-gold-500 bg-gold-500/10 border-gold-500/20';
                  else if (rep.role === 'admin') roleBadge = 'text-allvino-500 bg-allvino-500/10 border-allvino-500/20';
                  else if (rep.role === 'representante') roleBadge = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';

                  const isCurrentUser = rep.id === currentUserId;

                  return (
                    <tr key={rep.id} className="hover:bg-stone-900/15 group transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                            isCurrentUser ? 'bg-allvino-500 text-white' : 'bg-stone-800 text-stone-300'
                          }`}>
                            {rep.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-200 flex items-center gap-1.5">
                              {rep.nome}
                              {isCurrentUser && (
                                <span className="text-[8px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider border border-stone-700">
                                  Você
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-400 font-mono">{rep.email}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${roleBadge}`}>
                          {rep.role === 'owner' ? 'Owner' : rep.role === 'admin' ? 'Admin' : 'Representante'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {rep.role === 'admin' || rep.role === 'owner' ? (
                          <span className="text-stone-500 italic text-[10px]">Todos (Admin)</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-[10px] text-stone-300 font-medium">
                              {rep.ufs && rep.ufs.length > 0 ? (rep.ufs.length === 27 ? 'Nacional' : rep.ufs.join(', ')) : 'Nenhuma'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingRep(rep);
                                setEditUfs(rep.ufs || []);
                              }}
                              className="text-[10px] text-gold-500 hover:text-gold-400 underline ml-1 cursor-pointer focus:outline-none"
                            >
                              Editar
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-stone-200">
                        {rep.budgets_count}
                      </td>
                      <td className="py-3 px-4 text-stone-400 font-mono">{dataCadastro}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          {isCurrentUser ? (
                            <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Ativo</span>
                          ) : (
                            <button
                              onClick={() => handleToggleActive(rep.id, rep.ativo)}
                              disabled={actionLoadingId === rep.id}
                              className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 select-none focus:outline-none ${
                                rep.ativo ? 'bg-emerald-600' : 'bg-stone-700'
                              } ${actionLoadingId === rep.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                  rep.ativo ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {isCurrentUser ? (
                            <span className="text-[10px] text-stone-500 font-medium italic">Privilégio total</span>
                          ) : (
                            <>
                              {deleteConfirmId === rep.id ? (
                                <div className="flex items-center gap-2 animate-fade-in">
                                  <button
                                    onClick={() => handleDelete(rep.id)}
                                    disabled={actionLoadingId === rep.id}
                                    className="px-2 py-1 bg-red-950/60 border border-red-800 text-red-400 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-red-900 hover:text-white transition-colors"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-2 py-1 bg-stone-800 border border-stone-700 text-stone-400 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-stone-700 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(rep.id)}
                                  disabled={actionLoadingId === rep.id}
                                  className="text-stone-500 hover:text-red-400 p-1.5 rounded bg-stone-900 border border-stone-850 hover:border-red-900/40 hover:bg-red-950/10 transition-all"
                                  title="Excluir representante"
                                >
                                  {actionLoadingId === rep.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={13} />
                                  )}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-stone-850 border border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5 animate-scale-up">
            
            {/* Fechar Modal */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 p-1 rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Titulo */}
            <div className="space-y-1">
              <h3 className="font-display text-base font-semibold text-stone-50 tracking-wider uppercase">
                Cadastrar Representante
              </h3>
              <p className="text-[11px] text-stone-400">
                Preencha os dados de login e cargo para liberar o acesso ao catálogo B2B.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alessandro Silveira"
                  value={modalNome}
                  onChange={(e) => setModalNome(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-gold-500 transition-colors placeholder-stone-700"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  required
                  placeholder="vendedor@allvino.com"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-gold-500 transition-colors placeholder-stone-700"
                />
              </div>

              {/* Senha */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                  Senha de Acesso
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-gold-500 transition-colors placeholder-stone-700"
                />
              </div>

              {/* Cargo / Role */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                  Nível de Acesso (Cargo)
                </label>
                <div className="relative">
                  <select
                    value={modalRole}
                    onChange={(e) => setModalRole(e.target.value as 'admin' | 'representante')}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-gold-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="representante">Representante (Vendas B2B)</option>
                    <option value="admin">Administrador (Gestão de Vinhos & Contas)</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-stone-500">
                    <Shield size={12} />
                  </div>
                </div>
              </div>

              {/* UFs Ativas para Representante */}
              {modalRole === 'representante' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                      Estados Habilitados (UF)
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalUfs(modalUfs.length === 27 ? [] : [...ESTADOS_UF])}
                      className="text-[9px] text-gold-500 hover:text-gold-400 font-bold uppercase tracking-wider"
                    >
                      {modalUfs.length === 27 ? 'Limpar Todos' : 'Selecionar Todos'}
                    </button>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5 max-h-36 overflow-y-auto p-2 bg-stone-900 border border-stone-800 rounded-lg scrollbar-thin scrollbar-thumb-stone-700">
                    {ESTADOS_UF.map((uf) => {
                      const isSelected = modalUfs.includes(uf);
                      return (
                        <button
                          key={uf}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setModalUfs(modalUfs.filter((item) => item !== uf));
                            } else {
                              setModalUfs([...modalUfs, uf]);
                            }
                          }}
                          className={`py-1 text-[10px] font-bold rounded border transition-all ${
                            isSelected
                              ? 'bg-gold-500/20 border-gold-500 text-gold-500 font-bold'
                              : 'bg-stone-850 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300'
                          }`}
                        >
                          {uf}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {modalError && (
                <div className="p-3 bg-red-950/40 border border-red-800/30 rounded-lg text-[11px] text-red-400 text-center leading-relaxed font-semibold">
                  {modalError}
                </div>
              )}

              {/* Ações do Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-allvino-500 hover:bg-allvino-600 active:bg-allvino-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-75"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    'Salvar Cadastro'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de UFs */}
      {editingRep && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-stone-850 border border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5 animate-scale-up">
            
            {/* Fechar Modal */}
            <button
              onClick={() => setEditingRep(null)}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 p-1 rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Titulo */}
            <div className="space-y-1">
              <h3 className="font-display text-base font-semibold text-stone-50 tracking-wider uppercase">
                Editar Estados de {editingRep.nome}
              </h3>
              <p className="text-[11px] text-stone-400">
                Selecione as UFs habilitadas para este representante visualizar e gerar orçamentos.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateUfs} className="space-y-4">
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                    Estados Habilitados (UF)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditUfs(editUfs.length === 27 ? [] : [...ESTADOS_UF])}
                    className="text-[9px] text-gold-500 hover:text-gold-400 font-bold uppercase tracking-wider"
                  >
                    {editUfs.length === 27 ? 'Limpar Todos' : 'Selecionar Todos'}
                  </button>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5 p-2 bg-stone-900 border border-stone-800 rounded-lg">
                  {ESTADOS_UF.map((uf) => {
                    const isSelected = editUfs.includes(uf);
                    return (
                      <button
                        key={uf}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditUfs(editUfs.filter((item) => item !== uf));
                          } else {
                            setEditUfs([...editUfs, uf]);
                          }
                        }}
                        className={`py-1 text-[10px] font-bold rounded border transition-all ${
                          isSelected
                            ? 'bg-gold-500/20 border-gold-500 text-gold-500 font-bold'
                            : 'bg-stone-850 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300'
                        }`}
                      >
                        {uf}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ações do Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingRep(null)}
                  className="px-4 py-2 border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-allvino-500 hover:bg-allvino-600 active:bg-allvino-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-75"
                >
                  {editLoading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Regiões'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
