'use client';

import { useState } from 'react';
import { Wine, FileDown, ArrowLeft, Check, Copy, Lock, Layers } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function DesignSystemPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const colorsAllvino = [
    { name: 'allvino-50', hex: '#FDF2F4', text: 'text-stone-950' },
    { name: 'allvino-100', hex: '#FAD1D8', text: 'text-stone-950' },
    { name: 'allvino-200', hex: '#F4A4B3', text: 'text-stone-950' },
    { name: 'allvino-300', hex: '#EC7089', text: 'text-stone-950' },
    { name: 'allvino-400', hex: '#E03D60', text: 'text-white' },
    { name: 'allvino-500', hex: '#A61C3C', text: 'text-white' },
    { name: 'allvino-600', hex: '#8B132E', text: 'text-white' },
    { name: 'allvino-700', hex: '#6B0B20', text: 'text-white' },
    { name: 'allvino-800', hex: '#4B0513', text: 'text-white' },
    { name: 'allvino-900', hex: '#2C0007', text: 'text-white' },
  ];

  const colorsGold = [
    { name: 'gold-50', hex: '#FCF9EE', text: 'text-stone-950' },
    { name: 'gold-100', hex: '#F7EFCE', text: 'text-stone-950' },
    { name: 'gold-200', hex: '#EFE093', text: 'text-stone-950' },
    { name: 'gold-300', hex: '#E6CF59', text: 'text-stone-950' },
    { name: 'gold-400', hex: '#DCBD2C', text: 'text-stone-950' },
    { name: 'gold-500', hex: '#D4AF37', text: 'text-stone-950' },
    { name: 'gold-600', hex: '#B59325', text: 'text-white' },
    { name: 'gold-700', hex: '#917417', text: 'text-white' },
    { name: 'gold-800', hex: '#6E550D', text: 'text-white' },
    { name: 'gold-900', hex: '#4C3A04', text: 'text-white' },
  ];

  const colorsStone = [
    { name: 'stone-50', hex: '#FAF9F6', text: 'text-stone-950' },
    { name: 'stone-100', hex: '#F2F0EA', text: 'text-stone-950' },
    { name: 'stone-200', hex: '#E1DDD0', text: 'text-stone-950' },
    { name: 'stone-300', hex: '#C3BCAB', text: 'text-stone-950' },
    { name: 'stone-400', hex: '#9C9381', text: 'text-stone-950' },
    { name: 'stone-500', hex: '#766D5B', text: 'text-white' },
    { name: 'stone-600', hex: '#5A5243', text: 'text-white' },
    { name: 'stone-700', hex: '#3A352C', text: 'text-white' },
    { name: 'stone-800', hex: '#1A1617', text: 'text-white' },
    { name: 'stone-850', hex: '#120F10', text: 'text-white' },
    { name: 'stone-900', hex: '#0B090A', text: 'text-white' },
    { name: 'stone-950', hex: '#050404', text: 'text-white' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <header className="mb-12 border-b border-stone-800 pb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <Logo variant="light" width={140} height={45} priority />
            <h1 className="mt-3 font-display text-2xl font-medium text-stone-50">
              Identidade Visual Allvino
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-800/50 hover:bg-stone-800 px-5 py-2.5 text-xs font-semibold text-stone-200 shadow-lg transition duration-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao Catálogo
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Navegação Rápida Lateral */}
          <aside className="lg:col-span-1">
            <nav className="sticky top-24 space-y-1">
              <a href="#cores" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-stone-100 transition">
                1. Cores de Marca
              </a>
              <a href="#tipografia" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-stone-100 transition">
                2. Tipografia & Títulos
              </a>
              <a href="#botoes" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-stone-100 transition">
                3. Botões & Ações
              </a>
              <a href="#formularios" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-stone-100 transition">
                4. Formulários & Inputs
              </a>
              <a href="#sombras" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-stone-100 transition">
                5. Elevações & Superfícies
              </a>
              <a href="#componentes" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-stone-100 transition">
                6. Componentes Reutilizáveis
              </a>
            </nav>
          </aside>

          {/* Conteúdo Principal */}
          <main className="lg:col-span-3 space-y-16">
            
            {/* Seção 1: Cores */}
            <section id="cores" className="scroll-mt-6">
              <h2 className="font-display text-2xl font-semibold text-stone-100 mb-6 flex items-center gap-2">
                <span className="text-gold-500">1.</span> Cores de Marca (Paletas)
              </h2>
              
              <div className="space-y-8">
                {/* Allvino Burgundy */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
                    Vinho / Borgonha
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {colorsAllvino.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => copyToClipboard(c.hex)}
                        className="group flex flex-col justify-end rounded-xl p-3 h-20 text-left transition hover:scale-105 duration-200 focus:outline-none shadow-md"
                        style={{ backgroundColor: c.hex }}
                        title="Clique para copiar o Hex"
                      >
                        <div className={`${c.text} flex items-center justify-between w-full`}>
                          <p className="text-[11px] font-semibold font-mono tracking-tight">{c.hex}</p>
                          {copied === c.hex ? (
                            <Check className="h-3 w-3 opacity-80" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Allvino Gold */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
                    Ouro / Destaques
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {colorsGold.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => copyToClipboard(c.hex)}
                        className="group flex flex-col justify-end rounded-xl p-3 h-20 text-left transition hover:scale-105 duration-200 focus:outline-none shadow-md"
                        style={{ backgroundColor: c.hex }}
                        title="Clique para copiar o Hex"
                      >
                        <div className={`${c.text} flex items-center justify-between w-full`}>
                          <p className="text-[11px] font-semibold font-mono tracking-tight">{c.hex}</p>
                          {copied === c.hex ? (
                            <Check className="h-3 w-3 opacity-80" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Neutros de Fundo e Superfície */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
                    Superfícies & Neutros
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {colorsStone.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => copyToClipboard(c.hex)}
                        className="group flex flex-col justify-end rounded-xl p-3 h-20 text-left transition hover:scale-105 duration-200 focus:outline-none shadow-md border border-stone-850"
                        style={{ backgroundColor: c.hex }}
                        title="Clique para copiar o Hex"
                      >
                        <div className={`${c.text} flex items-center justify-between w-full`}>
                          <p className="text-[11px] font-semibold font-mono tracking-tight">{c.hex}</p>
                          {copied === c.hex ? (
                            <Check className="h-3 w-3 opacity-80" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 2: Tipografia */}
            <section id="tipografia" className="scroll-mt-6 border-t border-stone-850 pt-12">
              <h2 className="font-display text-2xl font-semibold text-stone-100 mb-6 flex items-center gap-2">
                <span className="text-gold-500">2.</span> Tipografia & Títulos
              </h2>
              
              <div className="space-y-8 bg-stone-850 p-8 rounded-2xl border border-stone-800">
                <h1 className="font-display text-4xl md:text-5xl font-medium text-stone-50 tracking-display">
                  ALLVINO B2B
                </h1>

                <h2 className="font-display text-2xl md:text-3xl font-medium text-gold-500 tracking-display">
                  Nossa Seleção
                </h2>

                <h3 className="font-display text-lg md:text-xl font-medium text-stone-100 tracking-display">
                  Vinhos Tintos Nacionais
                </h3>

                <p className="font-sans text-sm text-stone-300 leading-relaxed max-w-2xl">
                  O Allvino Catalog B2B permite que atacadistas de vinhos atendam restaurantes, bares, supermercados e empórios com agilidade, gerando catálogos PDF customizados e compartilhando via WhatsApp.
                </p>

                <span className="text-xs font-semibold uppercase tracking-display-wide text-allvino-400 block">
                  SELEÇÃO DE RÓTULOS PREMIUM
                </span>
              </div>
            </section>

            {/* Seção 3: Botões */}
            <section id="botoes" className="scroll-mt-6 border-t border-stone-850 pt-12">
              <h2 className="font-display text-2xl font-semibold text-stone-100 mb-6 flex items-center gap-2">
                <span className="text-gold-500">3.</span> Botões & Ações
              </h2>
              
              <div className="flex flex-wrap items-center gap-6 bg-stone-850 p-8 rounded-2xl border border-stone-800">
                <button className="rounded-lg bg-allvino-500 px-6 py-3 text-xs font-semibold text-white transition hover:bg-allvino-600 shadow-lg active:scale-95 duration-200">
                  Salvar Alterações
                </button>

                <button className="rounded-lg border border-gold-500 bg-transparent px-6 py-3 text-xs font-semibold text-gold-500 shadow-md transition hover:bg-gold-500 hover:text-stone-900 active:scale-95 duration-200">
                  Editar Cadastro
                </button>

                <button className="rounded-lg border border-stone-800 bg-stone-900 px-6 py-3 text-xs font-semibold text-stone-300 shadow-sm transition hover:bg-stone-850 active:scale-95 duration-200">
                  Cancelar
                </button>

                <button className="rounded-lg bg-red-950/40 border border-red-800/30 px-6 py-3 text-xs font-semibold text-red-400 transition hover:bg-red-900 hover:text-white">
                  Excluir Vinho
                </button>

                <button className="flex items-center gap-2 rounded-full bg-allvino-500 hover:bg-allvino-600 px-5 py-3.5 text-xs font-semibold text-white shadow-lift hover:shadow-lift transition duration-300">
                  <FileDown className="h-4 w-4" />
                  Gerar Catálogo PDF (3)
                </button>
              </div>
            </section>

            {/* Seção 4: Formulários */}
            <section id="formularios" className="scroll-mt-6 border-t border-stone-850 pt-12">
              <h2 className="font-display text-2xl font-semibold text-stone-100 mb-6 flex items-center gap-2">
                <span className="text-gold-500">4.</span> Formulários & Inputs
              </h2>
              
              <div className="bg-stone-850 p-8 rounded-2xl border border-stone-800 space-y-5 max-w-xl">
                <div className="space-y-2">
                  <label htmlFor="example-name" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Nome do Vinho
                  </label>
                  <input
                    id="example-name"
                    type="text"
                    defaultValue="Reserva Cabernet Sauvignon"
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-xs text-stone-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none transition duration-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="example-select" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Tipo de Vinho
                    </label>
                    <select
                      id="example-select"
                      className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-xs text-stone-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none transition duration-200"
                    >
                      <option>Tinto</option>
                      <option>Branco</option>
                      <option>Rosé</option>
                      <option>Espumante</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="example-price" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Preço de Atacado (R$)
                    </label>
                    <input
                      id="example-price"
                      type="number"
                      defaultValue="245.90"
                      className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-xs text-stone-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none transition duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="example-textarea" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Ficha Técnica Detalhada
                  </label>
                  <textarea
                    id="example-textarea"
                    rows={3}
                    defaultValue="Vinho encorpado, com passagem de 12 meses em barricas de carvalho francês. Notas de frutas negras maduras e especiarias."
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-xs text-stone-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none transition duration-200"
                  />
                </div>
              </div>
            </section>

            {/* Seção 5: Sombras */}
            <section id="sombras" className="scroll-mt-6 border-t border-stone-850 pt-12">
              <h2 className="font-display text-2xl font-semibold text-stone-100 mb-6 flex items-center gap-2">
                <span className="text-gold-500">5.</span> Elevações & Superfícies
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-stone-800 bg-stone-850 p-8 shadow-soft flex flex-col justify-center items-center min-h-[140px]">
                  <Layers className="h-6 w-6 text-stone-400 mb-2" />
                  <span className="text-xs font-semibold text-stone-300">Superfície Elevada (shadow-soft)</span>
                </div>

                <div className="rounded-2xl border border-allvino-500/20 bg-stone-850 p-8 shadow-lift transition hover:scale-[1.02] duration-300 flex flex-col justify-center items-center min-h-[140px]">
                  <Layers className="h-6 w-6 text-allvino-400 mb-2" />
                  <span className="text-xs font-semibold text-allvino-400">Efeito Hover Ativo (shadow-lift)</span>
                </div>
              </div>
            </section>

            {/* Seção 6: Componentes */}
            <section id="componentes" className="scroll-mt-6 border-t border-stone-850 pt-12">
              <h2 className="font-display text-2xl font-semibold text-stone-100 mb-6 flex items-center gap-2">
                <span className="text-gold-500">6.</span> Componentes Reutilizáveis
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Exemplo de card de vinho simplificado em dark mode */}
                <div className="group rounded-2xl border border-stone-800 bg-stone-850 overflow-hidden shadow-soft transition duration-300 hover:shadow-lift hover:border-allvino-500/30">
                  <div className="relative aspect-square w-full bg-stone-900 flex items-center justify-center p-6 mb-3">
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-850 to-transparent opacity-80" />
                    <Wine className="h-20 w-20 text-allvino-500 stroke-[1.2] relative z-10 transition duration-500 group-hover:scale-110" />
                    <span className="absolute top-4 left-4 rounded-full bg-allvino-500/90 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow relative z-20">
                      Destaque
                    </span>
                    <span className="absolute top-4 right-4 rounded-full bg-stone-800 border border-stone-700 px-2 py-0.5 text-[9px] font-semibold text-gold-400 relative z-20">
                      95 pts
                    </span>
                  </div>
                  
                  <div className="p-5 pt-2">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h3 className="font-display text-base font-semibold text-stone-50 group-hover:text-gold-400 transition truncate">
                        Château Margaux 2018
                      </h3>
                      <span className="text-sm font-semibold text-gold-400 font-display shrink-0">R$ 1.890</span>
                    </div>
                    <p className="text-xs text-stone-400 mb-4">Margaux • França</p>
                    
                    <button className="w-full rounded-lg bg-allvino-500 hover:bg-allvino-600 py-2.5 text-center text-xs font-semibold text-white transition duration-200">
                      Adicionar à Seleção
                    </button>
                  </div>
                </div>

                {/* Card de Área do Representante (Logado) */}
                <div className="rounded-2xl border border-stone-800 bg-stone-850/60 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-gold-500 text-xs font-semibold uppercase tracking-wider mb-3">
                      <Lock className="h-3.5 w-3.5" />
                      Área do Representante
                    </div>
                    <h3 className="font-display text-lg font-medium text-stone-50 mb-4">
                      Sessão Ativa
                    </h3>
                  </div>
                  
                  <div className="bg-stone-900 rounded-lg p-3.5 border border-stone-800 text-[11px] font-mono text-stone-400 space-y-1.5">
                    <div>Vendedor: <span className="text-stone-200">Alessandro Silveira</span></div>
                    <div>Sessão: <span className="text-emerald-500 font-bold">Autenticado</span></div>
                    <div>Histórico: <span className="text-stone-200">Habilitado</span></div>
                  </div>
                </div>
              </div>
            </section>

          </main>
        </div>

      </div>
    </div>
  );
}
