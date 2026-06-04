'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createWineServer,
  updateWineServer,
  uploadWineImageAction,
} from '@/app/actions/wines';
import type { Wine } from '@/types/wine';
import { Loader2, ArrowLeft, Save, Upload, Wine as WineIcon } from 'lucide-react';
import Link from 'next/link';

interface WineFormProps {
  initialData?: Wine;
}

export default function WineForm({ initialData }: WineFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imagem_url || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Validações básicas no cliente
    const safraStr = formData.get('safra') as string;
    const safra = safraStr ? parseInt(safraStr, 10) : null;
    const preco = parseFloat(formData.get('preco_atacado') as string);
    const caixa = parseInt(formData.get('caixa_fechada_qnt') as string, 10);
    const graduacaoStr = formData.get('graduacao_alcoolica') as string;
    const graduacao = graduacaoStr ? parseFloat(graduacaoStr) : null;

    const currentYear = new Date().getFullYear();
    if (safra !== null && (safra < 1900 || safra > currentYear + 1)) {
      setError(`A safra deve ser entre 1900 e ${currentYear + 1}.`);
      setLoading(false);
      return;
    }

    if (preco < 0) {
      setError('O preço de atacado deve ser maior ou igual a zero.');
      setLoading(false);
      return;
    }

    if (caixa <= 0) {
      setError('A quantidade por caixa fechada deve ser maior que zero.');
      setLoading(false);
      return;
    }

    if (graduacao !== null && (graduacao < 0 || graduacao > 100)) {
      setError('A graduação alcoólica deve ser entre 0 e 100.');
      setLoading(false);
      return;
    }

    try {
      let finalImageUrl = initialData?.imagem_url || null;

      // 1. Faz upload da imagem se houver novo arquivo selecionado
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);

        const uploadRes = await uploadWineImageAction(uploadData);
        if (uploadRes.error) {
          setError(`Erro no upload da imagem: ${uploadRes.error}`);
          setLoading(false);
          return;
        }
        if (uploadRes.publicUrl) {
          finalImageUrl = uploadRes.publicUrl;
        }
      }

      // 2. Monta objeto de dados para persistência
      const winePayload = {
        nome: formData.get('nome') as string,
        produtor: formData.get('produtor') as string,
        pais: formData.get('pais') as string,
        regiao: (formData.get('regiao') as string) || null,
        uva_varietal: (formData.get('uva_varietal') as string) || null,
        tipo: formData.get('tipo') as any,
        safra,
        graduacao_alcoolica: graduacao,
        preco_atacado: preco,
        caixa_fechada_qnt: caixa,
        ficha_tecnica_detalhada: (formData.get('ficha_tecnica_detalhada') as string) || null,
        imagem_url: finalImageUrl,
        ativo: formData.get('ativo') === 'true',
        destaque: formData.get('destaque') === 'true',
        ordem: initialData ? initialData.ordem : 0,
      };

      // 3. Salva no banco de dados (inserir ou atualizar)
      let res;
      if (initialData) {
        res = await updateWineServer(initialData.id, winePayload);
      } else {
        res = await createWineServer(winePayload);
      }

      if (res.error) {
        setError('Ocorreu um erro ao salvar o vinho. Por favor, verifique os campos e tente novamente.');
        setLoading(false);
      } else {
        router.push('/admin/vinhos');
        router.refresh();
      }
    } catch (err: any) {
      setError('Ocorreu um erro ao salvar o vinho. Por favor, verifique os campos e tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Voltar */}
      <div className="flex items-center gap-2 select-none">
        <Link
          href="/admin/vinhos"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar para listagem
        </Link>
      </div>

      {/* Título da Página */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide uppercase">
          {initialData ? 'Editar Vinho' : 'Cadastrar Novo Vinho'}
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {initialData ? `Modificando informações de "${initialData.nome}"` : 'Preencha as informações abaixo para adicionar um rótulo ao catálogo.'}
        </p>
      </div>

      {/* Card do Formulário */}
      <div className="bg-[#1A1617] border border-gray-800/60 rounded-xl p-8 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload e Preview de Rótulo (Coluna Esquerda no md) */}
            <div className="flex flex-col items-center justify-start space-y-4">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider text-center block w-full">
                Imagem do Rótulo
              </label>

              <div className="w-full aspect-[3/4] bg-[#0B090A] border border-gray-800 rounded-lg overflow-hidden flex items-center justify-center text-gray-600 relative select-none shadow-inner">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                ) : (
                  <WineIcon size={40} className="stroke-[1.2]" />
                )}
              </div>

              <div className="w-full relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                  id="image-upload"
                  className="hidden"
                />
                <label
                  htmlFor="image-upload"
                  className="w-full py-2.5 px-4 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer select-none"
                >
                  <Upload size={14} />
                  Selecionar Foto
                </label>
              </div>
            </div>

            {/* Inputs de Dados (Colunas Centro/Direita no md) */}
            <div className="md:col-span-2 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Nome do Vinho *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    required
                    disabled={loading}
                    defaultValue={initialData?.nome}
                    placeholder="Ex: Reserva Cabernet Sauvignon"
                    className="w-full bg-[#0B090A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#A61C3C] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Produtor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Produtor *
                  </label>
                  <input
                    type="text"
                    name="produtor"
                    required
                    disabled={loading}
                    defaultValue={initialData?.produtor}
                    placeholder="Ex: Vinícola Valduga"
                    className="w-full bg-[#0B090A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#A61C3C] transition-all disabled:opacity-50"
                  />
                </div>

                {/* País */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    País de Origem *
                  </label>
                  <input
                    type="text"
                    name="pais"
                    required
                    disabled={loading}
                    defaultValue={initialData?.pais || 'Brasil'}
                    placeholder="Ex: Brasil"
                    className="w-full bg-[#0B090A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#A61C3C] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Região */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Região
                  </label>
                  <input
                    type="text"
                    name="regiao"
                    disabled={loading}
                    defaultValue={initialData?.regiao || ''}
                    placeholder="Ex: Vale dos Vinhedos"
                    className="w-full bg-[#0B090A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#A61C3C] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Uva / Varietal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Uva / Varietal
                  </label>
                  <input
                    type="text"
                    name="uva_varietal"
                    disabled={loading}
                    defaultValue={initialData?.uva_varietal || ''}
                    placeholder="Ex: Cabernet Sauvignon, Merlot"
                    className="w-full bg-[#0B090A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#A61C3C] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Tipo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Tipo de Vinho *
                  </label>
                  <select
                    name="tipo"
                    required
                    disabled={loading}
                    defaultValue={initialData?.tipo || 'Tinto'}
                    className="w-full bg-[#0B090A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#A61C3C] transition-all disabled:opacity-50 appearance-none"
                  >
                    <option value="Tinto">Tinto</option>
                    <option value="Branco">Branco</option>
                    <option value="Rose">Rose</option>
                    <option value="Espumante">Espumante</option>
                    <option value="Fortificado">Fortificado</option>
                    <option value="Licoroso">Licoroso</option>
                  </select>
                </div>

                {/* Safra */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Safra (Ano)
                  </label>
                  <input
                    type="number"
                    name="safra"
                    disabled={loading}
                    defaultValue={initialData?.safra || ''}
                    placeholder="Ex: 2022"
                    className="w-full bg-[#0B090A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#A61C3C] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Preço de Atacado */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Preço Atacado (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="preco_atacado"
                    required
                    disabled={loading}
                    defaultValue={initialData?.preco_atacado}
                    placeholder="Ex: 89.90"
                    className="w-full bg-[#0B090A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#A61C3C] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Caixa Fechada Qnt */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Caixa Fechada (qnt) *
                  </label>
                  <input
                    type="number"
                    name="caixa_fechada_qnt"
                    required
                    disabled={loading}
                    defaultValue={initialData?.caixa_fechada_qnt || 6}
                    placeholder="Ex: 6"
                    className="w-full bg-[#0B090A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#A61C3C] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Graduação Alcoólica */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Graduação Alcoólica (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="graduacao_alcoolica"
                    disabled={loading}
                    defaultValue={initialData?.graduacao_alcoolica || ''}
                    placeholder="Ex: 13.5"
                    className="w-full bg-[#0B090A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#A61C3C] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Ficha Técnica Detalhada */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Ficha Técnica Comercial / Descrição
                  </label>
                  <textarea
                    name="ficha_tecnica_detalhada"
                    rows={4}
                    disabled={loading}
                    defaultValue={initialData?.ficha_tecnica_detalhada || ''}
                    placeholder="Ex: Aromas frutados intensos, paladar macio com taninos maduros e final prolongado..."
                    className="w-full bg-[#0B090A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#A61C3C] transition-all disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Toggles (Ativo / Destaque) */}
                <div className="space-y-1.5 sm:col-span-2 grid grid-cols-2 gap-4 pt-2">
                  {/* Destaque */}
                  <div className="flex items-center justify-between p-3.5 bg-[#0B090A] border border-gray-800 rounded-lg select-none">
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Destaque da Semana
                    </span>
                    <select
                      name="destaque"
                      defaultValue={initialData?.destaque ? 'true' : 'false'}
                      disabled={loading}
                      className="bg-transparent text-sm text-gray-200 font-bold focus:outline-none border-none cursor-pointer"
                    >
                      <option value="false" className="bg-[#1A1617] text-gray-300">Não</option>
                      <option value="true" className="bg-[#1A1617] text-[#A61C3C]">Sim</option>
                    </select>
                  </div>

                  {/* Ativo */}
                  <div className="flex items-center justify-between p-3.5 bg-[#0B090A] border border-gray-800 rounded-lg select-none">
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Disponível no Catálogo
                    </span>
                    <select
                      name="ativo"
                      defaultValue={initialData?.ativo !== false ? 'true' : 'false'}
                      disabled={loading}
                      className="bg-transparent text-sm text-gray-200 font-bold focus:outline-none border-none cursor-pointer"
                    >
                      <option value="false" className="bg-[#1A1617] text-gray-300">Não</option>
                      <option value="true" className="bg-[#1A1617] text-green-500">Sim</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toast / Mensagem de Erro */}
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-[#EF4444]/40 rounded-lg text-sm text-[#EF4444] text-center leading-relaxed">
              {error}
            </div>
          )}

          {/* Botão de Envio */}
          <div className="flex justify-end pt-4 border-t border-gray-800/40 select-none">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#A61C3C] hover:bg-[#85162F] active:bg-[#A61C3C] text-white font-semibold rounded-lg text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-[#A61C3C]/50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Salvar Vinho
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
