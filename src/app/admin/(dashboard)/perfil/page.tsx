'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  fetchCurrentProfileServer, 
  updateCurrentProfileServer, 
  type UserProfile 
} from '@/app/actions/profile';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Shield, 
  Loader2, 
  Save, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status/Toast states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetchCurrentProfileServer();
        if (res.error) {
          showToast('error', res.error);
        } else if (res.profile) {
          setProfile(res.profile);
          setNome(res.profile.nome);
          setEmail(res.profile.email);
          setWhatsapp(formatPhone(res.profile.whatsapp || ''));
        }
      } catch (err) {
        console.error(err);
        showToast('error', 'Erro ao carregar dados do perfil.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Helper para formatar telefone brasileiro
  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    } else if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setWhatsapp(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    // Validações básicas
    if (password && password !== confirmPassword) {
      setErrorMsg('A confirmação da nova senha não confere.');
      setSaving(false);
      return;
    }

    if (password && password.length < 6) {
      setErrorMsg('A nova senha deve possuir pelo menos 6 caracteres.');
      setSaving(false);
      return;
    }

    try {
      const cleanPhone = whatsapp.replace(/\D/g, '');
      const res = await updateCurrentProfileServer({
        nome,
        email,
        whatsapp: cleanPhone,
        password: password || undefined,
      });

      if (res.error) {
        setErrorMsg(res.error);
        showToast('error', 'Não foi possível salvar as alterações.');
      } else {
        showToast('success', 'Alterações de perfil salvas com sucesso!');
        setPassword('');
        setConfirmPassword('');
        // Atualiza o estado local do perfil para refletir no cabeçalho
        if (profile) {
          setProfile({ ...profile, nome, email, whatsapp: cleanPhone });
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ocorreu um erro inesperado.');
      showToast('error', 'Erro inesperado.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 text-stone-400 gap-4">
        <Loader2 size={36} className="animate-spin text-allvino-500" />
        <p className="text-xs uppercase tracking-widest font-semibold font-mono">Carregando perfil...</p>
      </div>
    );
  }

  // Estilos dos Badges de Cargo
  let roleBadge = 'text-stone-400 bg-stone-900 border-stone-800';
  if (profile?.role === 'owner') roleBadge = 'text-gold-500 bg-gold-500/10 border-gold-500/20';
  else if (profile?.role === 'admin') roleBadge = 'text-allvino-500 bg-allvino-500/10 border-allvino-500/20';
  else if (profile?.role === 'representante') roleBadge = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';

  return (
    <div className="space-y-8 animate-fade-in text-stone-200 font-sans max-w-2xl mx-auto">
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
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-stone-500">
          <Link href="/admin" className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider hover:text-stone-300 transition-colors">
            <ArrowLeft size={10} />
            Painel
          </Link>
          <span className="text-[10px] font-bold">/</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-gold-500">Meu Perfil</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-stone-50 tracking-display uppercase">
              Meu Perfil
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              Gerencie seus dados cadastrais, e-mail de acesso e senha do portal.
            </p>
          </div>
          <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full border tracking-wider uppercase ${roleBadge}`}>
            {profile?.role === 'owner' ? 'Owner' : profile?.role === 'admin' ? 'B2B Admin' : 'Representante'}
          </span>
        </div>
      </div>

      {/* Card do Formulário */}
      <div className="bg-stone-850 border border-stone-800 rounded-xl p-6 md:p-8 shadow-soft">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Seção 1: Dados Pessoais */}
          <div className="space-y-4">
            <div className="border-b border-stone-800 pb-2">
              <h2 className="text-xs font-bold text-stone-200 tracking-wider uppercase flex items-center gap-2">
                <User size={14} className="text-gold-500" />
                Dados Cadastrais
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Nome Completo
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label htmlFor="whatsapp" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  WhatsApp de Vendas
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-500 pointer-events-none">
                    <Phone size={14} />
                  </span>
                  <input
                    id="whatsapp"
                    type="tel"
                    placeholder="Ex: (11) 99999-9999"
                    value={whatsapp}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Credenciais */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-stone-800 pb-2">
              <h2 className="text-xs font-bold text-stone-200 tracking-wider uppercase flex items-center gap-2">
                <Mail size={14} className="text-allvino-500" />
                Credenciais de Acesso
              </h2>
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                E-mail de Login
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-500 pointer-events-none">
                  <Mail size={14} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="seuemail@allvino.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="pass" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Nova Senha (Opcional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-500 pointer-events-none">
                    <Lock size={14} />
                  </span>
                  <input
                    id="pass"
                    type="password"
                    placeholder="Deixe em branco para manter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPass" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-500 pointer-events-none">
                    <Lock size={14} />
                  </span>
                  <input
                    id="confirmPass"
                    type="password"
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Erro Geral do Form */}
          {errorMsg && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/30 rounded-lg text-xs text-red-400 text-center leading-relaxed font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Ação Principal */}
          <div className="flex justify-end pt-4 border-t border-stone-800">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-allvino-500 hover:bg-allvino-600 active:bg-allvino-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 select-none shadow-lift hover:shadow-lift/10 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Salvando Alterações...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
