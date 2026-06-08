'use client';

import { useState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Loader2, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await loginAction(formData);

      if (res.error) {
        // Usa a mensagem padrão refinada conforme o contrato de copywriting se o Supabase reportar credenciais erradas
        if (res.error.includes('Invalid login credentials') || res.error.includes('invalid_credentials')) {
          setError('E-mail ou senha incorretos. Por favor, verifique suas credenciais e tente novamente.');
        } else {
          setError(res.error);
        }
        setLoading(false);
      } else if (res.success) {
        // Redireciona com reload completo para garantir que o middleware e layout re-avaliem a sessão fresca
        window.location.href = '/admin';
      }
    } catch (err: any) {
      setError('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Elemento de iluminação sutil no fundo */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-allvino-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-allvino-500/5 blur-[120px] pointer-events-none" />

      {/* Logo / Marca */}
      <div className="mb-8 text-center z-10 select-none">
        <h1 className="font-display text-4xl font-semibold tracking-display text-white flex items-center justify-center gap-2">
          ALLVINO
        </h1>
        <p className="text-[10px] font-bold text-gold-500 mt-2 tracking-display-wide uppercase">
          Portal do Atacado (B2B)
        </p>
      </div>

      {/* Card do Formulário */}
      <div className="w-full max-w-md bg-stone-850 border border-stone-800 rounded-2xl p-8 shadow-soft z-10 backdrop-blur-md bg-opacity-95 focus-within:border-gold-500/20 transition-all duration-300">
        <h2 className="font-display text-lg font-medium text-stone-50 mb-6 text-center">
          Acesso Administrativo
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* E-mail Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              E-mail corporativo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-500 pointer-events-none">
                <Mail size={15} />
              </span>
              <input
                type="email"
                name="email"
                required
                disabled={loading}
                placeholder="nome@allvino.com"
                className="w-full pl-10 pr-4 py-3 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Senha Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Senha de acesso
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-500 pointer-events-none">
                <Lock size={15} />
              </span>
              <input
                type="password"
                name="password"
                required
                disabled={loading}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Toast / Mensagem de Erro */}
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/30 rounded-lg text-xs text-red-400 text-center leading-relaxed">
              {error}
            </div>
          )}

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-allvino-500 hover:bg-allvino-600 active:bg-allvino-500 text-white font-semibold rounded-lg text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 select-none shadow-lift hover:shadow-lift/10 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-allvino-500/50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Autenticando...
              </>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>
      </div>

      {/* Rodapé institucional */}
      <div className="mt-12 text-center text-[10px] font-medium tracking-wide text-stone-600 select-none">
        &copy; {new Date().getFullYear()} ALLVINO B2B. Todos os direitos reservados.
      </div>
    </div>
  );
}
