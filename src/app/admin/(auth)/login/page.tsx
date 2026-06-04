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
    <div className="min-h-screen bg-[#0B090A] text-gray-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Elemento de iluminação sutil no fundo */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#A61C3C]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#A61C3C]/5 blur-[120px] pointer-events-none" />

      {/* Logo / Marca */}
      <div className="mb-8 text-center z-10 select-none">
        <h1 className="text-3xl font-extrabold tracking-widest text-white flex items-center justify-center gap-2">
          ALLVINO
        </h1>
        <p className="text-xs text-gray-400 mt-2 tracking-widest uppercase">
          Portal do Atacado (B2B)
        </p>
      </div>

      {/* Card do Formulário */}
      <div className="w-full max-w-md bg-[#1A1617] border border-gray-800/60 rounded-xl p-8 shadow-2xl z-10 backdrop-blur-md bg-opacity-80">
        <h2 className="text-xl font-bold text-gray-100 mb-6 text-center">
          Acesso Administrativo
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* E-mail Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
              E-mail corporativo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                <Mail size={16} />
              </span>
              <input
                type="email"
                name="email"
                required
                disabled={loading}
                placeholder="nome@allvino.com"
                className="w-full pl-10 pr-4 py-3 bg-[#0B090A] border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#A61C3C] focus:ring-1 focus:ring-[#A61C3C] transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Senha Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
              Senha de acesso
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                <Lock size={16} />
              </span>
              <input
                type="password"
                name="password"
                required
                disabled={loading}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-[#0B090A] border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#A61C3C] focus:ring-1 focus:ring-[#A61C3C] transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Toast / Mensagem de Erro */}
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-[#EF4444]/40 rounded-lg text-sm text-[#EF4444] text-center leading-relaxed">
              {error}
            </div>
          )}

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#A61C3C] hover:bg-[#85162F] active:bg-[#A61C3C] text-white font-semibold rounded-lg text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 select-none shadow-md disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-[#A61C3C]/50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Autenticando...
              </>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>
      </div>

      {/* Rodapé institucional */}
      <div className="mt-12 text-center text-xs text-gray-600 select-none">
        &copy; {new Date().getFullYear()} Allvino Catalog. Todos os direitos reservados.
      </div>
    </div>
  );
}
