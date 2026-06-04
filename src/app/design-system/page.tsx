'use client';

import { useState } from 'react';
import { Wine, Sparkles, FileDown, ArrowLeft, Check, Copy } from 'lucide-react';
import Link from 'next/link';

export default function DesignSystemPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const colorsAllvino = [
    { name: 'allvino-50', hex: '#fbf5f6', text: 'text-allvino-900' },
    { name: 'allvino-100', hex: '#f3e1e5', text: 'text-allvino-900' },
    { name: 'allvino-200', hex: '#e6c2cb', text: 'text-allvino-900' },
    { name: 'allvino-300', hex: '#d196a5', text: 'text-allvino-900' },
    { name: 'allvino-400', hex: '#b9657a', text: 'text-white' },
    { name: 'allvino-500', hex: '#9B2335', text: 'text-white', isBase: true },
    { name: 'allvino-600', hex: '#8B1A2B', text: 'text-white', isAccent: true },
    { name: 'allvino-700', hex: '#6E1422', text: 'text-white' },
    { name: 'allvino-800', hex: '#500F1A', text: 'text-white' },
    { name: 'allvino-900', hex: '#330A11', text: 'text-white' },
  ];

  const colorsStone = [
    { name: 'stone-50', hex: '#fafaf9', text: 'text-stone-900' },
    { name: 'stone-100', hex: '#f5f5f4', text: 'text-stone-900' },
    { name: 'stone-200', hex: '#e7e5e4', text: 'text-stone-900' },
    { name: 'stone-300', hex: '#d6d3d1', text: 'text-stone-900' },
    { name: 'stone-400', hex: '#a8a29e', text: 'text-stone-900' },
    { name: 'stone-500', hex: '#78716c', text: 'text-white' },
    { name: 'stone-600', hex: '#57534e', text: 'text-white' },
    { name: 'stone-700', hex: '#44403c', text: 'text-white' },
    { name: 'stone-800', hex: '#292524', text: 'text-white' },
    { name: 'stone-900', hex: '#1c1917', text: 'text-white' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <header className="mb-12 border-b border-stone-200 pb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-allvino-600 font-semibold text-sm uppercase tracking-display-wide">
              <Sparkles className="h-4 w-4" />
              Ambiente de Testes / Design System
            </div>
            <h1 className="mt-2 font-display text-4xl md:text-5xl font-medium text-stone-900">
              Identidade Visual Allvino
            </h1>
            <p className="mt-3 text-stone-600 max-w-2xl text-sm md:text-base">
              Nosso sistema de design combina a sofisticação da tipografia clássica com a presença imponente da paleta de cores bordô, transmitindo a exclusividade de uma curadoria profissional de vinhos B2B.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao Catálogo
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Navegação Rápida Lateral */}
          <aside className="lg:col-span-1">
            <nav className="sticky top-6 space-y-1">
              <a href="#cores" className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                1. Cores de Marca
              </a>
              <a href="#tipografia" className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                2. Tipografia & Títulos
              </a>
              <a href="#botoes" className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                3. Botões & Ações
              </a>
              <a href="#formularios" className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                4. Formulários & Inputs
              </a>
              <a href="#sombras" className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                5. Elevações & Sombras
              </a>
              <a href="#componentes" className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                6. Componentes Reutilizáveis
              </a>
            </nav>
          </aside>

          {/* Conteúdo Principal */}
          <main className="lg:col-span-3 space-y-16">
            
            {/* Seção 1: Cores */}
            <section id="cores" className="scroll-mt-6">
              <h2 className="font-display text-2xl font-semibold text-stone-900 mb-6">
                1. Cores de Marca (Paletas)
              </h2>
              
              <div className="space-y-8">
                {/* Allvino Burgundy */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                    Allvino Burgundy (Vermelho Vinho Oficial)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {colorsAllvino.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => copyToClipboard(c.hex)}
                        className="group flex flex-col justify-between rounded-xl p-3 h-28 text-left transition hover:scale-102 focus:outline-none"
                        style={{ backgroundColor: c.hex }}
                      >
                        <div className={`flex justify-between w-full items-start ${c.text}`}>
                          <span className="text-[10px] font-mono font-bold tracking-tight">{c.name}</span>
                          {copied === c.hex ? (
                            <Check className="h-3.5 w-3.5 opacity-80" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                        <div className={c.text}>
                          {c.isAccent && <span className="inline-block rounded-full bg-white/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider mb-1">Acento</span>}
                          {c.isBase && <span className="inline-block rounded-full bg-white/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider mb-1">Base</span>}
                          <p className="text-xs font-semibold font-mono tracking-tight">{c.hex}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stone Neutrals */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                    Stone Neutrals (Neutros Quentes Premium)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {colorsStone.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => copyToClipboard(c.hex)}
                        className="group flex flex-col justify-between rounded-xl p-3 h-28 text-left transition hover:scale-102 focus:outline-none"
                        style={{ backgroundColor: c.hex }}
                      >
                        <div className={`flex justify-between w-full items-start ${c.text}`}>
                          <span className="text-[10px] font-mono font-bold tracking-tight">{c.name}</span>
                          {copied === c.hex ? (
                            <Check className="h-3.5 w-3.5 opacity-80" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                        <div className={c.text}>
                          <p className="text-xs font-semibold font-mono tracking-tight">{c.hex}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 2: Tipografia */}
            <section id="tipografia" className="scroll-mt-6 border-t border-stone-200 pt-12">
              <h2 className="font-display text-2xl font-semibold text-stone-900 mb-6">
                2. Tipografia & Títulos
              </h2>
              
              <div className="space-y-6 bg-white p-6 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Display Title (Cinzel)</span>
                  <h1 className="font-display text-4xl md:text-5xl font-medium text-stone-900 tracking-display">
                    ALLVINO B2B
                  </h1>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Section Header (Cinzel)</span>
                  <h2 className="font-display text-2xl md:text-3xl font-medium text-stone-900 tracking-display">
                    Nossa Seleção
                  </h2>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Subsection Header (Cinzel)</span>
                  <h3 className="font-display text-lg md:text-xl font-medium text-stone-900 tracking-display">
                    Vinhos Tintos Nacionais
                  </h3>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Body Text (Inter)</span>
                  <p className="font-sans text-sm text-stone-600 leading-relaxed">
                    O Allvino Catalog B2B permite que atacadistas de vinhos atendam restaurantes, bares, supermercados e empórios com agilidade, gerando catálogos PDF customizados e compartilhando via WhatsApp.
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Caps Label (Inter, Tracking display-wide)</span>
                  <span className="text-xs font-semibold uppercase tracking-display-wide text-allvino-600 block">
                    SELEÇÃO DE RÓTULOS PREMIUM
                  </span>
                </div>
              </div>
            </section>

            {/* Seção 3: Botões */}
            <section id="botoes" className="scroll-mt-6 border-t border-stone-200 pt-12">
              <h2 className="font-display text-2xl font-semibold text-stone-900 mb-6">
                3. Botões & Ações
              </h2>
              
              <div className="flex flex-wrap items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200">
                <div className="space-y-1">
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Primary Button</span>
                  <button className="rounded-lg bg-allvino-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-allvino-700 shadow-md">
                    Salvar Alterações
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Secondary Button</span>
                  <button className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50">
                    Cancelar
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Outline Brand</span>
                  <button className="rounded-lg border border-allvino-200 bg-allvino-50 px-5 py-2.5 text-xs font-semibold text-allvino-700 transition hover:bg-allvino-100">
                    Filtro Avançado
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Destructive Button</span>
                  <button className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700">
                    Excluir Vinho
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Floating PDF Button</span>
                  <div className="relative inline-block">
                    <button className="flex items-center gap-2 rounded-full bg-allvino-600 px-4 py-3.5 text-xs font-semibold text-white shadow-xl">
                      <FileDown className="h-4 w-4" />
                      Gerar Catálogo PDF (3)
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 4: Formulários */}
            <section id="formularios" className="scroll-mt-6 border-t border-stone-200 pt-12">
              <h2 className="font-display text-2xl font-semibold text-stone-900 mb-6">
                4. Formulários & Inputs
              </h2>
              
              <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4 max-w-xl">
                <div className="space-y-1">
                  <label htmlFor="example-name" className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Nome do Vinho
                  </label>
                  <input
                    id="example-name"
                    type="text"
                    defaultValue="Reserva Cabernet Sauvignon"
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-800 focus:border-allvino-500 focus:outline-none focus:ring-1 focus:ring-allvino-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="example-select" className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Tipo de Vinho
                    </label>
                    <select
                      id="example-select"
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-800 focus:border-allvino-500 focus:outline-none focus:ring-1 focus:ring-allvino-500"
                    >
                      <option>Tinto</option>
                      <option>Branco</option>
                      <option>Rosé</option>
                      <option>Espumante</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="example-price" className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Preço de Atacado (R$)
                    </label>
                    <input
                      id="example-price"
                      type="number"
                      defaultValue="245.90"
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-800 focus:border-allvino-500 focus:outline-none focus:ring-1 focus:ring-allvino-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="example-textarea" className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Ficha Técnica Detalhada
                  </label>
                  <textarea
                    id="example-textarea"
                    rows={3}
                    defaultValue="Vinho encorpado, com passagem de 12 meses em barricas de carvalho francês. Notas de frutas negras maduras e especiarias."
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-800 focus:border-allvino-500 focus:outline-none focus:ring-1 focus:ring-allvino-500"
                  />
                </div>
              </div>
            </section>

            {/* Seção 5: Sombras */}
            <section id="sombras" className="scroll-mt-6 border-t border-stone-200 pt-12">
              <h2 className="font-display text-2xl font-semibold text-stone-900 mb-6">
                5. Elevações & Sombras
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">Sombra Suave (shadow-soft)</span>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Utilizada em cards de vinhos e inputs secundários para dar profundidade sutil sem pesar o visual da interface.
                  </p>
                </div>

                <div className="rounded-2xl border border-allvino-100 bg-white p-6 shadow-lift transition hover:scale-101">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-allvino-600 font-semibold block mb-2">Efeito Elevado (shadow-lift)</span>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Efeito de hover dinâmico que projeta uma sombra bordô difusa, destacando o item sob foco de forma premium.
                  </p>
                </div>
              </div>
            </section>

            {/* Seção 6: Componentes */}
            <section id="componentes" className="scroll-mt-6 border-t border-stone-200 pt-12">
              <h2 className="font-display text-2xl font-semibold text-stone-900 mb-6">
                6. Componentes Reutilizáveis
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Exemplo de card de vinho simplificado */}
                <div className="group rounded-2xl border border-stone-200 bg-white p-4 shadow-soft transition hover:shadow-lift">
                  <div className="relative aspect-square w-full rounded-xl bg-stone-100 flex items-center justify-center p-6 mb-3">
                    <Wine className="h-16 w-16 text-allvino-600 stroke-[1.2]" />
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-allvino-600 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                      Destaque
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-display text-base font-semibold text-stone-900 group-hover:text-allvino-600 transition">
                      Château Margaux
                    </h3>
                    <span className="text-sm font-semibold text-stone-900">R$ 1.890</span>
                  </div>
                  <p className="text-xs text-stone-400 mb-3">Allvino Imports • França</p>
                  
                  <button className="w-full rounded-lg bg-stone-900 py-2 text-center text-xs font-semibold text-white transition hover:bg-stone-800">
                    Adicionar à Seleção
                  </button>
                </div>
              </div>
            </section>

          </main>
        </div>

      </div>
    </div>
  );
}
