'use client';

import { useState, useEffect } from 'react';
import { CatalogClient } from './CatalogClient';
import { ClientCatalogClient } from './cliente/ClientCatalogClient';
import { createBrowserSupabase } from '@/lib/supabase-client';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  LogIn, 
  Database, 
  Loader2, 
  Wine as WineIcon, 
  ArrowRight,
  Info
} from 'lucide-react';
import type { Wine } from '@/types/wine';

const ESTADOS_UF = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

type AccessTab = 'cliente' | 'representante' | 'admin';

export function HomeCatalogWrapper({ initialWines }: { initialWines: Wine[] }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClientAuthorized, setIsClientAuthorized] = useState(false);

  // Seleção de perfil ativo
  const [activeTab, setActiveTab] = useState<AccessTab>('cliente');

  // Campos de login de Cliente
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientUf, setClientUf] = useState('');

  // Campos de login de Representante/Admin
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Estados de erro e loading
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function checkSession() {
      try {
        // 1. Verificar se há credenciais de cliente salvas no localStorage
        const storedPhone = localStorage.getItem('allvino_client_phone');
        const storedName = localStorage.getItem('allvino_client_name');
        const storedEmail = localStorage.getItem('allvino_client_email');
        if (storedPhone && storedName && storedEmail) {
          setIsClientAuthorized(true);
        }

        // 2. Verificar se há sessão de representante/admin ativa
        const supabase = createBrowserSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Erro ao verificar sessão do usuário:', err);
      } finally {
        setAuthChecked(true);
      }
    }
    checkSession();
  }, []);

  // Login de Cliente
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!clientName.trim()) {
      setErrorMsg('Por favor, informe seu nome.');
      return;
    }

    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Por favor, insira um número de telefone com DDD válido.');
      return;
    }

    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      setErrorMsg('Por favor, insira um e-mail válido.');
      return;
    }

    if (!clientUf) {
      setErrorMsg('Por favor, selecione seu Estado (UF).');
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem('allvino_client_phone', clientPhone);
      localStorage.setItem('allvino_client_name', clientName);
      localStorage.setItem('allvino_client_email', clientEmail);
      localStorage.setItem('allvino_client_uf', clientUf);
      setIsClientAuthorized(true);
    } catch (err) {
      setErrorMsg('Erro ao salvar os dados de acesso. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Login de Representante/Admin via Supabase
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!authEmail.trim() || !authPassword.trim()) {
      setErrorMsg('E-mail e senha são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      if (error) {
        setErrorMsg(error.message === 'Invalid login credentials' ? 'Credenciais de login inválidas.' : error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Obter perfil para validar role e status
        const { data: profile, error: profileError } = await supabase
          .from('admin_users')
          .select('role, ativo')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          setErrorMsg('Usuário não cadastrado no sistema.');
          setLoading(false);
          return;
        }

        if (!profile.ativo) {
          await supabase.auth.signOut();
          setErrorMsg('Esta conta está inativa. Entre em contato com o administrador.');
          setLoading(false);
          return;
        }

        // Redirecionamento com base na role
        if (profile.role === 'admin' || profile.role === 'owner') {
          // Se for admin, manda para o dashboard administrativo
          window.location.href = '/admin';
        } else if (profile.role === 'representante') {
          // Se for representante, ativa visualização do catálogo de representantes
          setIsAuthenticated(true);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro ao realizar o login.');
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-stone-400 gap-3">
        <Loader2 className="animate-spin text-gold-500" size={28} />
        <p className="text-xs uppercase tracking-wider font-bold">Carregando portal...</p>
      </div>
    );
  }

  // 1. Se estiver autenticado como representante/admin no Supabase, exibe o catálogo de representantes
  if (isAuthenticated) {
    return <CatalogClient initialWines={initialWines} />;
  }

  // 2. Se já preencheu dados de cliente anteriormente, exibe o catálogo de clientes diretamente
  if (isClientAuthorized) {
    return <ClientCatalogClient initialWines={initialWines} />;
  }

  // 3. Exibe a tela unificada de login com as 3 opções
  return (
    <div className="mx-auto my-8 max-w-md animate-fade-in px-4">
      <div className="rounded-2xl border border-stone-700/60 bg-stone-900/60 p-6 sm:p-8 shadow-soft backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-allvino-500/10 text-gold-500 mb-4 ring-1 ring-allvino-500/20">
            <WineIcon className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-stone-50">
            ALLVINO B2B
          </h2>
          <p className="mt-1.5 text-xs text-stone-400">
            Selecione seu perfil de acesso para navegar no catálogo e montar orçamentos.
          </p>
        </div>

        {/* Seleção de Perfil (Tabs) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-950/40 rounded-xl border border-stone-800 mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('cliente'); setErrorMsg(''); }}
            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-200 ${
              activeTab === 'cliente'
                ? 'bg-gold-500/10 border border-gold-500/20 text-gold-400'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Cliente
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('representante'); setErrorMsg(''); }}
            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-200 ${
              activeTab === 'representante'
                ? 'bg-gold-500/10 border border-gold-500/20 text-gold-400'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Vendedor
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setErrorMsg(''); }}
            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-200 ${
              activeTab === 'admin'
                ? 'bg-gold-500/10 border border-gold-500/20 text-gold-400'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Formulário Dinâmico */}
        {activeTab === 'cliente' ? (
          <form onSubmit={handleClientSubmit} className="space-y-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <label htmlFor="client-name" className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Seu Nome Completo *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="client-name"
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full rounded-xl border border-stone-700 bg-stone-950/40 py-3 pl-10 pr-4 text-sm text-stone-200 placeholder-stone-600 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition duration-200"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label htmlFor="client-phone" className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Seu WhatsApp / Telefone *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="client-phone"
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Ex: (11) 98888-8888"
                  className="w-full rounded-xl border border-stone-700 bg-stone-950/40 py-3 pl-10 pr-4 text-sm text-stone-200 placeholder-stone-600 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition duration-200"
                />
              </div>
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <label htmlFor="client-email" className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Seu E-mail *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="client-email"
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="Ex: joao@email.com"
                  className="w-full rounded-xl border border-stone-700 bg-stone-950/40 py-3 pl-10 pr-4 text-sm text-stone-200 placeholder-stone-600 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition duration-200"
                />
              </div>
            </div>

            {/* Estado (UF) */}
            <div className="space-y-1.5">
              <label htmlFor="client-uf" className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Seu Estado (UF) *
              </label>
              <select
                id="client-uf"
                required
                value={clientUf}
                onChange={(e) => setClientUf(e.target.value)}
                className="w-full rounded-xl border border-stone-700 bg-stone-950/40 py-3 px-3 text-sm text-stone-200 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition duration-200 cursor-pointer appearance-none"
              >
                <option value="" disabled className="bg-stone-900 text-stone-600">Selecione seu estado</option>
                {ESTADOS_UF.map((uf) => (
                  <option key={uf} value={uf} className="bg-stone-900 text-stone-200">{uf}</option>
                ))}
                <option value="OUTRO" className="bg-stone-900 text-gold-500 font-bold">Não Definido / Outro Estado</option>
              </select>
            </div>

            {clientUf === 'OUTRO' && (
              <div className="p-3 bg-gold-900/10 border border-gold-900/20 rounded-xl text-xs text-gold-500 leading-normal flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5 text-gold-500" />
                <span>
                  Para orçamentos nesta região, sugerimos entrar em contato comercial centralizado pelo telefone/WhatsApp: <strong>27 3261-9494</strong>
                </span>
              </div>
            )}

            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-allvino-500 py-3 text-sm font-semibold text-white transition hover:bg-allvino-600 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <span>Acessar Catálogo</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* E-mail */}
            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="text-xs font-bold uppercase tracking-wider text-stone-400">
                E-mail de Acesso *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Ex: seuemail@allvino.com.br"
                  className="w-full rounded-xl border border-stone-700 bg-stone-950/40 py-3 pl-10 pr-4 text-sm text-stone-200 placeholder-stone-600 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition duration-200"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label htmlFor="auth-pass" className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Senha *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="auth-pass"
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full rounded-xl border border-stone-700 bg-stone-950/40 py-3 pl-10 pr-4 text-sm text-stone-200 placeholder-stone-600 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition duration-200"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-allvino-500 py-3 text-sm font-semibold text-white transition hover:bg-allvino-600 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>
                    {activeTab === 'representante' ? 'Entrar como Representante' : 'Acessar Painel Admin'}
                  </span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
