'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Palette, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Layout, 
  ChevronRight, 
  Save, 
  RefreshCw,
  Eye,
  Upload,
  Trash2,
  FileImage,
  Info
} from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase-client';
import { 
  fetchCatalogSettingsAction, 
  updateCatalogSettingsAction,
  uploadCatalogTemplateAction
} from '@/app/actions/catalogs';

interface ThemeOption {
  id: string;
  name: string;
  desc: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  badge: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'classic',
    name: 'Clássico Vinho',
    desc: 'Capa tradicional em tom Borgonha rico com bordas e textos brancos, utilizando o logo original com acento dourado.',
    bgColor: 'bg-allvino-600',
    borderColor: 'border-stone-100',
    textColor: 'text-stone-100',
    accentColor: 'text-gold-400',
    badge: 'Burgundy Classic'
  },
  {
    id: 'gold',
    name: 'Luxo Imperial',
    desc: 'Visual ultra-premium de alto contraste. Fundo preto absoluto com bordas douradas e logotipia na cor Ouro.',
    bgColor: 'bg-stone-900',
    borderColor: 'border-gold-500',
    textColor: 'text-gold-500',
    accentColor: 'text-stone-100',
    badge: 'Luxury Gold'
  },
  {
    id: 'clean',
    name: 'Branco Minimalista',
    desc: 'Capa clara sofisticada e limpa. Fundo creme suave com bordas escuras, logo em preto e gargalo vermelho Allvino.',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-800',
    textColor: 'text-stone-800',
    accentColor: 'text-allvino-500',
    badge: 'Minimalist Clean'
  },
  {
    id: 'dark',
    name: 'Preto Carbono',
    desc: 'Visual furtivo "Stealth". Fundo carvão escuro com borda cinza mineral, tipografia branca e gargalo vermelho.',
    bgColor: 'bg-stone-850',
    borderColor: 'border-stone-700',
    textColor: 'text-stone-100',
    accentColor: 'text-allvino-500',
    badge: 'Midnight Stealth'
  }
];

export default function CatalogConfigurationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  // States de configuração
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [primaryColor, setPrimaryColor] = useState('#A61C3C');
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const [customMiddleUrl, setCustomMiddleUrl] = useState<string | null>(null);
  const [customBackCoverUrl, setCustomBackCoverUrl] = useState<string | null>(null);

  // Novos parâmetros de layout do PDF
  const [coverShowRep, setCoverShowRep] = useState(true);
  const [coverRepY, setCoverRepY] = useState(390);
  const [coverTextColor, setCoverTextColor] = useState('#FFFFFF');
  const [coverShowDate, setCoverShowDate] = useState(true);
  const [coverDateY, setCoverDateY] = useState(610);
  const [middleShowHeader, setMiddleShowHeader] = useState(true);
  const [middleHeaderColor, setMiddleHeaderColor] = useState('#FFFFFF');
  const [middleShowFooter, setMiddleShowFooter] = useState(true);
  const [middleFooterColor, setMiddleFooterColor] = useState('#787878');
  const [middleBgCards, setMiddleBgCards] = useState(true);
  const [backCoverShowInfo, setBackCoverShowInfo] = useState(true);
  const [backCoverInfoY, setBackCoverInfoY] = useState(480);
  const [backCoverInfoColor, setBackCoverInfoColor] = useState('#FFFFFF');

  // Parâmetros de layout de produto dinâmicos
  const [showBoxPrice, setShowBoxPrice] = useState(true);
  const [boxPriceLabel, setBoxPriceLabel] = useState('PREÇO DA CAIXA');
  const [showUnitPrice, setShowUnitPrice] = useState(false);
  const [unitPriceLabel, setUnitPriceLabel] = useState('PREÇO UNITÁRIO');
  const [boxUnits, setBoxUnits] = useState(6);
  const [showCountry, setShowCountry] = useState(true);
  const [showRegion, setShowRegion] = useState(true);
  const [showGrape, setShowGrape] = useState(true);
  const [showVintage, setShowVintage] = useState(true);
  const [showType, setShowType] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [middleProductNameColor, setMiddleProductNameColor] = useState('#12100E');
  const [middlePriceColor, setMiddlePriceColor] = useState('#A61C3C');
  const [middleTechInfoColor, setMiddleTechInfoColor] = useState('#12100E');
  const [previewTab, setPreviewTab] = useState<'cover' | 'middle' | 'back'>('cover');

  // Status de uploads
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMiddle, setUploadingMiddle] = useState(false);
  const [uploadingBackCover, setUploadingBackCover] = useState(false);

  // Status/Toast Geral
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetchCatalogSettingsAction();
      if (res.error) {
        showToast('error', res.error);
      } else if (res.data) {
        setSelectedTheme(res.data.cover_theme);
        setPrimaryColor(res.data.primary_color);
        setCustomCoverUrl(res.data.custom_cover_url || null);
        setCustomMiddleUrl(res.data.custom_middle_url || null);
        setCustomBackCoverUrl(res.data.custom_back_cover_url || null);
        
        // Novos campos
        setCoverShowRep(res.data.cover_show_rep ?? true);
        setCoverRepY(res.data.cover_rep_y ?? 390);
        setCoverTextColor(res.data.cover_text_color || '#FFFFFF');
        setCoverShowDate(res.data.cover_show_date ?? true);
        setCoverDateY(res.data.cover_date_y ?? 610);
        setMiddleShowHeader(res.data.middle_show_header ?? true);
        setMiddleHeaderColor(res.data.middle_header_color || '#FFFFFF');
        setMiddleShowFooter(res.data.middle_show_footer ?? true);
        setMiddleFooterColor(res.data.middle_footer_color || '#787878');
        setMiddleBgCards(res.data.middle_bg_cards ?? true);
        setBackCoverShowInfo(res.data.back_cover_show_info ?? true);
        setBackCoverInfoY(res.data.back_cover_info_y ?? 480);
        setBackCoverInfoColor(res.data.back_cover_info_color || '#FFFFFF');

        // Novos campos dinâmicos do produto
        setShowBoxPrice(res.data.show_box_price ?? true);
        setBoxPriceLabel(res.data.box_price_label || 'PREÇO DA CAIXA');
        setShowUnitPrice(res.data.show_unit_price ?? false);
        setUnitPriceLabel(res.data.unit_price_label || 'PREÇO UNITÁRIO');
        setBoxUnits(res.data.box_units ?? 6);
        setShowCountry(res.data.show_country ?? true);
        setShowRegion(res.data.show_region ?? true);
        setShowGrape(res.data.show_grape ?? true);
        setShowVintage(res.data.show_vintage ?? true);
        setShowType(res.data.show_type ?? true);
        setShowDescription(res.data.show_description ?? true);
        setMiddleProductNameColor(res.data.middle_product_name_color || '#12100E');
        setMiddlePriceColor(res.data.middle_price_color || '#A61C3C');
        setMiddleTechInfoColor(res.data.middle_tech_info_color || '#12100E');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Erro ao carregar configurações do catálogo.');
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
        loadSettings();
      } catch (err) {
        console.error('Error verifying permissions:', err);
        window.location.href = '/admin';
      }
    }

    checkPermissions();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateCatalogSettingsAction({
        coverTheme: selectedTheme,
        primaryColor: primaryColor,
        customCoverUrl,
        customMiddleUrl,
        customBackCoverUrl,
        coverShowRep,
        coverRepY,
        coverTextColor,
        coverShowDate,
        coverDateY,
        middleShowHeader,
        middleHeaderColor,
        middleShowFooter,
        middleFooterColor,
        middleBgCards,
        backCoverShowInfo,
        backCoverInfoY,
        backCoverInfoColor,
        showBoxPrice,
        boxPriceLabel,
        showUnitPrice,
        unitPriceLabel,
        boxUnits,
        showCountry,
        showRegion,
        showGrape,
        showVintage,
        showType,
        showDescription,
        middleProductNameColor,
        middlePriceColor,
        middleTechInfoColor
      });

      if (res.error) {
        showToast('error', res.error);
      } else {
        showToast('success', 'Configurações de identidade visual e layout salvas com sucesso!');
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Erro inesperado ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'middle' | 'back_cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações básicas no cliente
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'O tamanho máximo permitido é 5MB.');
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      showToast('error', 'Apenas arquivos PNG ou JPG são aceitos.');
      return;
    }

    const setUploading = type === 'cover' ? setUploadingCover : type === 'middle' ? setUploadingMiddle : setUploadingBackCover;
    const setUrl = type === 'cover' ? setCustomCoverUrl : type === 'middle' ? setCustomMiddleUrl : setCustomBackCoverUrl;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await uploadCatalogTemplateAction(formData);
      if (res.error) {
        showToast('error', res.error);
      } else if (res.publicUrl) {
        setUrl(res.publicUrl);
        showToast('success', `Template de ${type === 'cover' ? 'capa' : type === 'middle' ? 'meio' : 'contra capa'} carregado com sucesso!`);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Erro ao realizar upload do template.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 text-stone-400 gap-4">
        <Loader2 size={36} className="animate-spin text-allvino-500" />
        <p className="text-xs uppercase tracking-widest font-semibold font-mono">Carregando configurações...</p>
      </div>
    );
  }

  // Encontra detalhes do tema selecionado para a visualização dinâmica da capa
  const activeTheme = THEME_OPTIONS.find(t => t.id === selectedTheme) || THEME_OPTIONS[0];

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
            <span className="text-[10px] uppercase font-bold tracking-wider text-gold-500">Configuração</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-stone-50 tracking-display uppercase">
            Identidade Visual do Catálogo
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Escolha o modelo de capa e a paleta de cores para os catálogos em PDF gerados por todos os representantes.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-allvino-500 hover:bg-allvino-600 active:bg-allvino-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 select-none shadow-lift hover:shadow-lift/10 focus:outline-none disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Gravando...
            </>
          ) : (
            <>
              <Save size={14} />
              Salvar Configurações
            </>
          )}
        </button>
      </div>

      {/* Painel Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Escolha do Tema (Esquerda) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-stone-850 border border-stone-800 rounded-xl p-6 shadow-soft space-y-6">
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <Layout className="text-gold-500 h-4.5 w-4.5" />
              <h2 className="text-xs font-bold text-stone-200 tracking-wider uppercase">Selecione o Modelo de Capa</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`text-left p-5 border rounded-xl bg-stone-900/50 hover:bg-stone-900 transition-all flex flex-col justify-between h-44 relative focus:outline-none group ${
                      isSelected 
                        ? 'border-gold-500/80 shadow-gold-glow' 
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xs font-bold text-stone-100 uppercase tracking-wider">
                          {theme.name}
                        </h3>
                        <span className={`text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded uppercase border ${
                          isSelected 
                            ? 'bg-gold-500/10 text-gold-500 border-gold-500/20' 
                            : 'bg-stone-800 text-stone-500 border-stone-800'
                        }`}>
                          {theme.badge}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                        {theme.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Pequeno mostrador de cores do tema */}
                      <div className="flex gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border border-stone-700 shadow-sm ${
                          theme.id === 'classic' ? 'bg-allvino-500' :
                          theme.id === 'gold' ? 'bg-stone-950' :
                          theme.id === 'clean' ? 'bg-stone-100' : 'bg-stone-800'
                        }`} />
                        <span className={`w-3.5 h-3.5 rounded-full border border-stone-700 shadow-sm ${
                          theme.id === 'classic' ? 'bg-stone-100' :
                          theme.id === 'gold' ? 'bg-gold-500' :
                          theme.id === 'clean' ? 'bg-stone-800' : 'bg-allvino-500'
                        }`} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        isSelected ? 'text-gold-500' : 'text-stone-500 group-hover:text-stone-400'
                      }`}>
                        {isSelected ? 'Selecionado' : 'Selecionar'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuração de Cor Primária (Abaixo dos Temas) */}
          <div className="bg-stone-850 border border-stone-800 rounded-xl p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <Palette className="text-allvino-500 h-4.5 w-4.5" />
              <h2 className="text-xs font-bold text-stone-200 tracking-wider uppercase">Cor Detalhe dos Produtos</h2>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Esta cor é aplicada em detalhes secundários do catálogo (tabelas, cabeçalhos de produtos e rodapés). 
              Ao selecionar <strong>Luxo Imperial</strong> ou <strong>Preto Carbono</strong>, o PDF aplicará cores temáticas otimizadas por padrão se não customizadas.
            </p>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-14 h-14 bg-transparent border-0 rounded cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Código Hexadecimal</label>
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#A61C3C"
                  maxLength={7}
                  className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs font-mono text-stone-200 focus:outline-none focus:border-gold-500 w-28 text-center"
                />
              </div>
              <button
                onClick={() => setPrimaryColor('#A61C3C')}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors focus:outline-none"
              >
                <RefreshCw size={10} />
                Padrão Allvino
              </button>
            </div>
          </div>

          {/* Upload de Templates Personalizados */}
          <div className="bg-stone-850 border border-stone-800 rounded-xl p-6 shadow-soft space-y-6">
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <FileImage className="text-gold-500 h-4.5 w-4.5" />
              <h2 className="text-xs font-bold text-stone-200 tracking-wider uppercase">Templates Personalizados (Capa, Meio e Contra Capa)</h2>
            </div>

            {/* Informações Técnicas */}
            <div className="bg-stone-900 border border-stone-800/80 rounded-xl p-4 space-y-2 flex items-start gap-3">
              <Info className="text-gold-500 h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-stone-100 uppercase tracking-wider">Padrão Técnico de Arquivo</h3>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Para obter o melhor enquadramento no catálogo final (360 × 640 pt, orientação retrato, otimizado para smartphones), utilize os seguintes padrões ao exportar artes do Canva ou Photoshop:
                </p>
                <ul className="text-[11px] text-stone-400 space-y-1 list-disc list-inside mt-2 font-mono">
                  <li><strong className="text-stone-300 font-sans">Proporção:</strong> Tela Vertical (9 : 16) — Stories/Reels</li>
                  <li><strong className="text-stone-300 font-sans">Resolução Mínima:</strong> 1080 × 1920 px a 96 DPI (RGB)</li>
                  <li><strong className="text-stone-300 font-sans">Resolução Recomendada:</strong> 1080 × 1920 px a 150 DPI (RGB)</li>
                  <li><strong className="text-stone-300 font-sans">Fotos de Produto:</strong> JPEG (qualidade 80–85%)</li>
                  <li><strong className="text-stone-300 font-sans">Logos e Ícones:</strong> PNG (fundo transparente)</li>
                  <li><strong className="text-stone-300 font-sans">Tamanho Limite:</strong> Até 5 MB por arquivo</li>
                </ul>
              </div>
            </div>

            {/* Lista de Uploads */}
            <div className="space-y-4">
              
              {/* Template 1: Capa */}
              <div className="p-4 border border-stone-800 rounded-xl bg-stone-900/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-allvino-500" />
                    <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Template da Capa</h3>
                  </div>
                  <p className="text-[11px] text-stone-400 max-w-md">
                    Imagem exibida na primeira página. <strong>Dimensão padrão recomendada: 1080 x 1920 px (proporção 9:16)</strong> para cobrir a página perfeitamente sem cortes nas laterais.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {customCoverUrl ? (
                    <div className="flex items-center gap-3 w-full justify-between md:justify-end">
                      <a href={customCoverUrl} target="_blank" rel="noopener noreferrer" className="relative group rounded-lg overflow-hidden border border-stone-700 flex-shrink-0 w-10 h-14 bg-stone-900">
                        <img src={customCoverUrl} alt="Capa" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-stone-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye size={12} className="text-stone-200" />
                        </div>
                      </a>
                      <button
                        onClick={() => setCustomCoverUrl(null)}
                        className="px-3 py-1.5 bg-red-950/30 border border-red-900/40 text-[10px] font-semibold uppercase tracking-wider text-red-400 hover:bg-red-900/20 rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Trash2 size={12} />
                        Remover
                      </button>
                    </div>
                  ) : (
                    <label className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-stone-700 hover:border-gold-500/40 hover:bg-stone-900/60 text-stone-400 hover:text-stone-200 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer select-none">
                      {uploadingCover ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-gold-500" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          Enviar Capa
                        </>
                      )}
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => handleUploadTemplate(e, 'cover')}
                        disabled={uploadingCover}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Template 2: Meio */}
              <div className="p-4 border border-stone-800 rounded-xl bg-stone-900/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Template do Meio (Fundo)</h3>
                  </div>
                  <p className="text-[11px] text-stone-400 max-w-md">
                    Aplicado como plano de fundo de todas as páginas de resumo e produtos. <strong>Dimensão padrão recomendada: 1080 x 1920 px (proporção 9:16)</strong>. Recomendamos usar marcas d'água sutis ou fundos limpos.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {customMiddleUrl ? (
                    <div className="flex items-center gap-3 w-full justify-between md:justify-end">
                      <a href={customMiddleUrl} target="_blank" rel="noopener noreferrer" className="relative group rounded-lg overflow-hidden border border-stone-700 flex-shrink-0 w-10 h-14 bg-stone-900">
                        <img src={customMiddleUrl} alt="Meio" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-stone-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye size={12} className="text-stone-200" />
                        </div>
                      </a>
                      <button
                        onClick={() => setCustomMiddleUrl(null)}
                        className="px-3 py-1.5 bg-red-950/30 border border-red-900/40 text-[10px] font-semibold uppercase tracking-wider text-red-400 hover:bg-red-900/20 rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Trash2 size={12} />
                        Remover
                      </button>
                    </div>
                  ) : (
                    <label className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-stone-700 hover:border-gold-500/40 hover:bg-stone-900/60 text-stone-400 hover:text-stone-200 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer select-none">
                      {uploadingMiddle ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-gold-500" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          Enviar Meio
                        </>
                      )}
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => handleUploadTemplate(e, 'middle')}
                        disabled={uploadingMiddle}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Template 3: Contra Capa */}
              <div className="p-4 border border-stone-800 rounded-xl bg-stone-900/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold-500" />
                    <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Template da Contra Capa</h3>
                  </div>
                  <p className="text-[11px] text-stone-400 max-w-md">
                    Imagem exibida na última página do catálogo. <strong>Dimensão padrão recomendada: 1080 x 1920 px (proporção 9:16)</strong> para fechamento perfeito sem cortes indesejados.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {customBackCoverUrl ? (
                    <div className="flex items-center gap-3 w-full justify-between md:justify-end">
                      <a href={customBackCoverUrl} target="_blank" rel="noopener noreferrer" className="relative group rounded-lg overflow-hidden border border-stone-700 flex-shrink-0 w-10 h-14 bg-stone-900">
                        <img src={customBackCoverUrl} alt="Contra Capa" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-stone-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye size={12} className="text-stone-200" />
                        </div>
                      </a>
                      <button
                        onClick={() => setCustomBackCoverUrl(null)}
                        className="px-3 py-1.5 bg-red-950/30 border border-red-900/40 text-[10px] font-semibold uppercase tracking-wider text-red-400 hover:bg-red-900/20 rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Trash2 size={12} />
                        Remover
                      </button>
                    </div>
                  ) : (
                    <label className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-stone-700 hover:border-gold-500/40 hover:bg-stone-900/60 text-stone-400 hover:text-stone-200 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer select-none">
                      {uploadingBackCover ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-gold-500" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          Enviar Contra Capa
                        </>
                      )}
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => handleUploadTemplate(e, 'back_cover')}
                        disabled={uploadingBackCover}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Ajustes de Diagramação do PDF */}
          <div className="bg-stone-850 border border-stone-800 rounded-xl p-6 shadow-soft space-y-6">
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <Layout className="text-gold-500 h-4.5 w-4.5" />
              <h2 className="text-xs font-bold text-stone-200 tracking-wider uppercase">Ajustes de Diagramação do PDF</h2>
            </div>
            
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              Use as configurações abaixo para alinhar e ocultar elementos dinâmicos do PDF. Excelente para garantir que as informações se adaptem perfeitamente ao design dos templates de Capa, Meio ou Contra Capa importados.
            </p>

            <div className="space-y-6 divide-y divide-stone-800/60 font-sans">
              
              {/* Seção 1: Ajustes da Capa */}
              <div className="space-y-4 pt-0">
                <h3 className="text-xs font-semibold text-gold-500 uppercase tracking-wider">Ajustes da Capa</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Mostrar Representante */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-stone-900/40 border border-stone-800">
                    <div>
                      <span className="text-[11px] font-bold text-stone-200 block">Exibir Representante</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">Mostrar dados de contato na capa</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={coverShowRep} 
                        onChange={(e) => setCoverShowRep(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                    </label>
                  </div>

                  {/* Mostrar Data */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-stone-900/40 border border-stone-800">
                    <div>
                      <span className="text-[11px] font-bold text-stone-200 block">Exibir Data de Geração</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">Mostrar data no rodapé da capa</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={coverShowDate} 
                        onChange={(e) => setCoverShowDate(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                    </label>
                  </div>

                </div>

                {/* Alturas e Cores */}
                <div className="space-y-4 pt-2">
                  
                  {coverShowRep && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wider">Posição do Representante (Cover Y)</label>
                        <span className="font-mono text-gold-500 font-bold">{coverRepY} pt</span>
                      </div>
                      <input 
                        type="range" 
                        min="80" 
                        max="620" 
                        value={coverRepY} 
                        onChange={(e) => setCoverRepY(parseInt(e.target.value))}
                        className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-allvino-500"
                      />
                    </div>
                  )}

                  {coverShowDate && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wider">Posição da Data (Date Y)</label>
                        <span className="font-mono text-gold-500 font-bold">{coverDateY} pt</span>
                      </div>
                      <input 
                        type="range" 
                        min="100" 
                        max="635" 
                        value={coverDateY} 
                        onChange={(e) => setCoverDateY(parseInt(e.target.value))}
                        className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-allvino-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider block">Cor do Texto da Capa</span>
                    <input 
                      type="color" 
                      value={coverTextColor} 
                      onChange={(e) => setCoverTextColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={coverTextColor} 
                      onChange={(e) => setCoverTextColor(e.target.value)}
                      maxLength={7}
                      className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs font-mono text-stone-200 focus:outline-none focus:border-gold-500 w-28 text-center"
                    />
                  </div>

                </div>
              </div>

              {/* Seção 2: Ajustes das Páginas de Produto (Meio) */}
              <div className="space-y-4 pt-4">
                <h3 className="text-xs font-semibold text-gold-500 uppercase tracking-wider">Ajustes das Páginas Internas (Meio)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Faixa de Cabeçalho */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-stone-900/40 border border-stone-800">
                    <div>
                      <span className="text-[11px] font-bold text-stone-200 block">Faixa do Cabeçalho</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">Mostrar barra vermelha/bordô no topo</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={middleShowHeader} 
                        onChange={(e) => setMiddleShowHeader(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                    </label>
                  </div>

                  {/* Mostrar Rodapé */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-stone-900/40 border border-stone-800">
                    <div>
                      <span className="text-[11px] font-bold text-stone-200 block">Exibir Rodapé</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">Linha, observações e nº de páginas</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={middleShowFooter} 
                        onChange={(e) => setMiddleShowFooter(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                    </label>
                  </div>

                  {/* Caixas de Fundo Creme */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-stone-900/40 border border-stone-800 md:col-span-2">
                    <div>
                      <span className="text-[11px] font-bold text-stone-200 block">Fundo dos Cards (Garrafa/Preço)</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">Usar fundo creme sob vinhos ou transparente para o template de meio</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={middleBgCards} 
                        onChange={(e) => setMiddleBgCards(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                    </label>
                  </div>

                </div>

                {/* Ajustes de Exibição de Preços */}
                <div className="border-t border-stone-800/60 pt-4 space-y-4">
                  <h4 className="text-[10px] font-bold text-gold-500 uppercase tracking-widest">Exibição de Preços</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Preço de Caixa */}
                    <div className="flex flex-col gap-3 p-4 rounded-lg bg-stone-900/40 border border-stone-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-stone-200 block">Exibir Preço da Caixa</span>
                          <span className="text-[10px] text-stone-400 block mt-0.5">Mostrar preço total da caixa de vinhos</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={showBoxPrice} 
                            onChange={(e) => setShowBoxPrice(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                        </label>
                      </div>
                      {showBoxPrice && (
                        <div className="space-y-1.5 border-t border-stone-800/40 pt-3">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Etiqueta do Preço de Caixa</label>
                          <input
                            type="text"
                            value={boxPriceLabel}
                            onChange={(e) => setBoxPriceLabel(e.target.value)}
                            placeholder="PREÇO DA CAIXA"
                            className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-gold-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Preço Unitário */}
                    <div className="flex flex-col gap-3 p-4 rounded-lg bg-stone-900/40 border border-stone-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-stone-200 block">Exibir Preço Unitário (Garrafa)</span>
                          <span className="text-[10px] text-stone-400 block mt-0.5">Calcular e exibir preço por garrafa individual</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={showUnitPrice} 
                            onChange={(e) => setShowUnitPrice(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                        </label>
                      </div>
                      {showUnitPrice && (
                        <div className="grid grid-cols-2 gap-3 border-t border-stone-800/40 pt-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Etiqueta do Preço Unitário</label>
                            <input
                              type="text"
                              value={unitPriceLabel}
                              onChange={(e) => setUnitPriceLabel(e.target.value)}
                              placeholder="PREÇO UNITÁRIO"
                              className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-gold-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Garrafas p/ Caixa (Padrão)</label>
                            <input
                              type="number"
                              min="1"
                              value={boxUnits}
                              onChange={(e) => setBoxUnits(Math.max(1, parseInt(e.target.value) || 6))}
                              className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-gold-500 font-mono text-center"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ajustes de Informações Técnicas */}
                <div className="border-t border-stone-800/60 pt-4 space-y-4">
                  <h4 className="text-[10px] font-bold text-gold-500 uppercase tracking-widest">Ficha Técnica e Badges</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    
                    {/* País */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-900/40 border border-stone-800">
                      <span className="text-[11px] font-semibold text-stone-300">Exibir País</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showCountry} 
                          onChange={(e) => setShowCountry(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-8 h-4.5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      </label>
                    </div>

                    {/* Região */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-900/40 border border-stone-800">
                      <span className="text-[11px] font-semibold text-stone-300">Exibir Região</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showRegion} 
                          onChange={(e) => setShowRegion(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-8 h-4.5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      </label>
                    </div>

                    {/* Uva */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-900/40 border border-stone-800">
                      <span className="text-[11px] font-semibold text-stone-300">Exibir Uva</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showGrape} 
                          onChange={(e) => setShowGrape(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-8 h-4.5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      </label>
                    </div>

                    {/* Safra */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-900/40 border border-stone-800">
                      <span className="text-[11px] font-semibold text-stone-300">Exibir Safra</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showVintage} 
                          onChange={(e) => setShowVintage(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-8 h-4.5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      </label>
                    </div>

                    {/* Tipo */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-900/40 border border-stone-800">
                      <span className="text-[11px] font-semibold text-stone-300">Exibir Tipo</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showType} 
                          onChange={(e) => setShowType(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-8 h-4.5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      </label>
                    </div>

                    {/* Descrição */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-900/40 border border-stone-800">
                      <span className="text-[11px] font-semibold text-stone-300">Exibir Descrição</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showDescription} 
                          onChange={(e) => setShowDescription(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-8 h-4.5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      </label>
                    </div>

                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-2">
                  
                  {!middleShowHeader && (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider block">Cor Texto Cabeçalho</span>
                      <input 
                        type="color" 
                        value={middleHeaderColor} 
                        onChange={(e) => setMiddleHeaderColor(e.target.value)}
                        className="w-7 h-7 rounded bg-transparent cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={middleHeaderColor} 
                        onChange={(e) => setMiddleHeaderColor(e.target.value)}
                        maxLength={7}
                        className="px-2 py-1 bg-stone-900 border border-stone-800 rounded-lg text-xs font-mono text-stone-300 w-24 text-center focus:outline-none"
                      />
                    </div>
                  )}

                  {middleShowFooter && (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider block">Cor Texto Rodapé</span>
                      <input 
                        type="color" 
                        value={middleFooterColor} 
                        onChange={(e) => setMiddleFooterColor(e.target.value)}
                        className="w-7 h-7 rounded bg-transparent cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={middleFooterColor} 
                        onChange={(e) => setMiddleFooterColor(e.target.value)}
                        maxLength={7}
                        className="px-2 py-1 bg-stone-900 border border-stone-800 rounded-lg text-xs font-mono text-stone-300 w-24 text-center focus:outline-none"
                      />
                    </div>
                  )}

                </div>

                {/* Cores Personalizadas do Produto (Páginas do Meio) */}
                <div className="border-t border-stone-800/40 pt-4 space-y-3">
                  <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">Personalização de Cores das Informações do Produto</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Nome do Produto */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-stone-900/20 border border-stone-800/60">
                      <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Nome do Produto & Produtor</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="color" 
                          value={middleProductNameColor} 
                          onChange={(e) => setMiddleProductNameColor(e.target.value)}
                          className="w-7 h-7 rounded bg-transparent cursor-pointer border-0"
                        />
                        <input 
                          type="text" 
                          value={middleProductNameColor} 
                          onChange={(e) => setMiddleProductNameColor(e.target.value)}
                          maxLength={7}
                          className="flex-1 px-2 py-1 bg-stone-900 border border-stone-850 rounded-lg text-xs font-mono text-stone-300 text-center focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Preço */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-stone-900/20 border border-stone-800/60">
                      <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Preço (Cartão / Texto)</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="color" 
                          value={middlePriceColor} 
                          onChange={(e) => setMiddlePriceColor(e.target.value)}
                          className="w-7 h-7 rounded bg-transparent cursor-pointer border-0"
                        />
                        <input 
                          type="text" 
                          value={middlePriceColor} 
                          onChange={(e) => setMiddlePriceColor(e.target.value)}
                          maxLength={7}
                          className="flex-1 px-2 py-1 bg-stone-900 border border-stone-850 rounded-lg text-xs font-mono text-stone-300 text-center focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Informações Técnicas */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-stone-900/20 border border-stone-800/60">
                      <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Informações Técnicas & Badges</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="color" 
                          value={middleTechInfoColor} 
                          onChange={(e) => setMiddleTechInfoColor(e.target.value)}
                          className="w-7 h-7 rounded bg-transparent cursor-pointer border-0"
                        />
                        <input 
                          type="text" 
                          value={middleTechInfoColor} 
                          onChange={(e) => setMiddleTechInfoColor(e.target.value)}
                          maxLength={7}
                          className="flex-1 px-2 py-1 bg-stone-900 border border-stone-850 rounded-lg text-xs font-mono text-stone-300 text-center focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Seção 3: Ajustes da Contra Capa */}
              <div className="space-y-4 pt-4">
                <h3 className="text-xs font-semibold text-gold-500 uppercase tracking-wider">Ajustes da Contra Capa</h3>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-900/40 border border-stone-800">
                  <div>
                    <span className="text-[11px] font-bold text-stone-200 block">Exibir Contato na Contra Capa</span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Mostrar dados do representante na última página</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={backCoverShowInfo} 
                      onChange={(e) => setBackCoverShowInfo(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-500 after:border-stone-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-allvino-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                  </label>
                </div>

                {backCoverShowInfo && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wider">Posição do Contato (Contra Capa Y)</label>
                        <span className="font-mono text-gold-500 font-bold">{backCoverInfoY} pt</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="625" 
                        value={backCoverInfoY} 
                        onChange={(e) => setBackCoverInfoY(parseInt(e.target.value))}
                        className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-allvino-500"
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider block">Cor do Texto da Contra Capa</span>
                      <input 
                        type="color" 
                        value={backCoverInfoColor} 
                        onChange={(e) => setBackCoverInfoColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={backCoverInfoColor} 
                        onChange={(e) => setBackCoverInfoColor(e.target.value)}
                        maxLength={7}
                        className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs font-mono text-stone-200 focus:outline-none focus:border-gold-500 w-28 text-center"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Pré-visualização do Catálogo (Direita) */}
        <div className="xl:col-span-1">
          <div className="bg-stone-850 border border-stone-800 rounded-xl p-5 shadow-soft flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="text-emerald-500 h-4.5 w-4.5" />
                <h2 className="text-xs font-bold text-stone-200 tracking-wider uppercase">Pré-visualização</h2>
              </div>
              
              {/* Tab Selector */}
              <div className="flex bg-stone-900/60 p-0.5 rounded-lg border border-stone-800 select-none">
                <button
                  type="button"
                  onClick={() => setPreviewTab('cover')}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                    previewTab === 'cover'
                      ? 'bg-stone-800 text-gold-500 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Capa
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('middle')}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                    previewTab === 'middle'
                      ? 'bg-stone-800 text-gold-500 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Meio
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('back')}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                    previewTab === 'back'
                      ? 'bg-stone-800 text-gold-500 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Contra Capa
                </button>
              </div>
            </div>

            {/* Simulação física do PDF (Proporções Mobile 9:16) */}
            <div className="flex-1 flex items-center justify-center bg-stone-900 border border-stone-800 rounded-lg p-4 select-none min-h-[360px]">
              
              {/* 1. Capa */}
              {previewTab === 'cover' && (
                <div 
                  className={`w-full max-w-[200px] aspect-[9/16] rounded border p-4 shadow-2xl relative transition-all duration-300 overflow-hidden bg-cover bg-center ${
                    customCoverUrl ? 'border-stone-700' : `${activeTheme.bgColor} ${activeTheme.borderColor}`
                  }`}
                  style={customCoverUrl ? { backgroundImage: `url(${customCoverUrl})` } : undefined}
                >
                  
                  {!customCoverUrl && (
                    <>
                      {/* Linha de borda interna */}
                      <div className={`absolute inset-2.5 border pointer-events-none ${
                        selectedTheme === 'classic' ? 'border-white/100' :
                        selectedTheme === 'gold' ? 'border-gold-500/100' :
                        selectedTheme === 'clean' ? 'border-stone-800/100' : 'border-stone-700/100'
                      }`} />

                      {/* Bloco Título do Logo */}
                      <div className="mt-14 text-center">
                        <span className={`font-display text-2xl font-bold tracking-display block relative ${activeTheme.textColor}`}>
                          ALLVINO
                          {/* Desenho do Gargalo de Garrafa simulado acima da letra "I" */}
                          <span className={`absolute w-[1.5px] h-[4px] -top-[5.5px] left-[55%] -translate-x-[50%] block ${
                            selectedTheme === 'clean' || selectedTheme === 'dark' ? 'bg-allvino-500' :
                            selectedTheme === 'gold' ? 'bg-gold-500' : 'bg-gold-400'
                          }`} />
                          <span className={`absolute w-[2px] h-[1px] -top-[5.5px] left-[55%] -translate-x-[50%] block ${
                            selectedTheme === 'clean' || selectedTheme === 'dark' ? 'bg-allvino-500' :
                            selectedTheme === 'gold' ? 'bg-gold-500' : 'bg-gold-400'
                          }`} />
                        </span>
                        
                        <span className={`text-[4.5px] font-bold tracking-widest uppercase block mt-1.5 ${
                          selectedTheme === 'clean' ? 'text-stone-500' :
                          selectedTheme === 'gold' ? 'text-stone-300' : 'text-stone-300'
                        }`}>
                          CATÁLOGO DE VINHOS EXCLUSIVOS • B2B
                        </span>
                        
                        <div className={`w-6 h-[0.4px] mx-auto my-3 ${
                          selectedTheme === 'clean' ? 'bg-stone-800' :
                          selectedTheme === 'gold' ? 'bg-gold-500' : 'bg-stone-300'
                        }`} />
                      </div>

                      {/* Título do Catálogo */}
                      <div className="mt-8 text-center px-1">
                        <p className={`text-[6.5px] italic font-semibold leading-relaxed ${activeTheme.textColor}`}>
                          Catálogo Personalizado de Vinhos
                        </p>
                      </div>
                    </>
                  )}

                  {/* Representante */}
                  {coverShowRep && (
                    <div 
                      className="absolute inset-x-0 text-center space-y-0.5 z-10 -translate-y-1/2"
                      style={{ 
                        top: `${(coverRepY / 640) * 100}%`,
                        color: coverTextColor
                      }}
                    >
                      <span className="text-[4.5px] uppercase font-bold tracking-wide block opacity-80">
                        Apresentado por:
                      </span>
                      <span className="text-[5.5px] font-bold block">
                        Alessandro Silveira
                      </span>
                      <span className="text-[4px] font-mono block opacity-90">
                        WhatsApp: (27) 99514-5536
                      </span>
                      <span className="text-[3.5px] font-mono block opacity-75">
                        comercial@allvino.com.br
                      </span>
                    </div>
                  )}
   
                  {/* Data */}
                  {coverShowDate && (
                    <div 
                      className="absolute inset-x-0 text-center z-10 -translate-y-1/2"
                      style={{ 
                        top: `${(coverDateY / 640) * 100}%`,
                        color: coverTextColor
                      }}
                    >
                      <span className="text-[4px] font-mono uppercase tracking-widest">
                        Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  )}

                </div>
              )}

              {/* 2. Meio */}
              {previewTab === 'middle' && (
                <div 
                  className="w-full max-w-[200px] aspect-[9/16] rounded border shadow-2xl relative transition-all duration-300 overflow-hidden flex flex-col bg-stone-50"
                  style={customMiddleUrl ? { backgroundImage: `url(${customMiddleUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#FFFEFC' }}
                >
                  {/* Header strip */}
                  {middleShowHeader && (
                    <div 
                      className="h-2.5 w-full flex items-center justify-between px-2 text-[3px] font-bold text-white uppercase select-none"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span>PRODUTO 01 / 10</span>
                      <span>ALLVINO B2B</span>
                    </div>
                  )}

                  {/* Bottle Hero Area */}
                  <div className="flex-1 min-h-0 flex items-center justify-center relative p-1 mt-0.5">
                    {/* Creme card background */}
                    {middleBgCards && !customMiddleUrl && (
                      <div className="absolute inset-0 bg-[#F8F4ED] border border-[#E1D7C8] rounded m-1 pointer-events-none" />
                    )}
                    
                    {/* Simulated Bottle */}
                    <div className="relative z-10 h-[70%] aspect-[1/3.5] flex flex-col items-center">
                      <div className="w-[2.5px] h-[8px] bg-red-800 rounded-t-sm" />
                      <div className="w-[1.5px] h-[12px] bg-[#12100E]" />
                      <div className="w-[8px] h-[30px] bg-[#12100E] rounded-b-md relative flex items-center justify-center">
                        <div className="w-[5px] h-[15px] bg-white rounded-[0.5px] flex flex-col items-center justify-center p-[0.3px]">
                          <div className="w-[3.5px] h-[3.5px] rounded-full border-[0.2px] border-amber-600 flex items-center justify-center">
                            <span className="text-[1px] scale-[0.6] font-serif text-amber-700">A</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="px-2 pb-1.5 space-y-0.5 relative z-10 flex flex-col">
                    <div>
                      <h4 
                        className="text-[6px] font-bold leading-tight line-clamp-1"
                        style={{ color: middleProductNameColor }}
                      >
                        Reserva Cabernet Sauvignon
                      </h4>
                      <p 
                        className="text-[4px] font-medium opacity-80"
                        style={{ color: middleProductNameColor }}
                      >
                        Vinícola Valduga
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-[1px]">
                      {['Brasil', 'Vale dos Vinhedos', 'Tinto'].map((badgeText, idx) => (
                        <span 
                          key={idx}
                          className="px-1 py-[0.5px] text-[3px] font-bold rounded-[0.5px] text-white"
                          style={{ backgroundColor: middleTechInfoColor }}
                        >
                          {badgeText}
                        </span>
                      ))}
                    </div>

                    {/* Price Card */}
                    {(showBoxPrice || showUnitPrice) && (
                      <div 
                        className={`p-0.5 rounded-[1.5px] flex items-center justify-between ${
                          middleBgCards ? 'text-white' : 'border'
                        }`}
                        style={{ 
                          borderColor: middlePriceColor, 
                          backgroundColor: middleBgCards ? middlePriceColor : 'transparent' 
                        }}
                      >
                        {showUnitPrice && (
                          <div className="flex flex-col">
                            <span 
                              className={`text-[2px] font-bold uppercase tracking-wider ${
                                middleBgCards ? 'text-white/80' : ''
                              }`}
                              style={!middleBgCards ? { color: middlePriceColor } : undefined}
                            >
                              {unitPriceLabel}
                            </span>
                            <span 
                              className="text-[4.5px] font-bold font-display"
                              style={!middleBgCards ? { color: middlePriceColor } : { color: '#FFFFFF' }}
                            >
                              R$ 49,90
                            </span>
                          </div>
                        )}
                        {showBoxPrice && (
                          <div className="flex flex-col text-right">
                            <span 
                              className={`text-[2px] font-bold uppercase tracking-wider ${
                                middleBgCards ? 'text-white/80' : ''
                              }`}
                              style={!middleBgCards ? { color: middlePriceColor } : undefined}
                            >
                              {boxPriceLabel}
                            </span>
                            <span 
                              className="text-[4.5px] font-bold font-display"
                              style={!middleBgCards ? { color: middlePriceColor } : { color: '#FFFFFF' }}
                            >
                              R$ 299,40
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {showDescription && (
                      <div className="space-y-[1px] border-t border-stone-800/10 pt-0.5">
                        <span 
                          className="text-[3.5px] font-bold block"
                          style={{ color: middleTechInfoColor }}
                        >
                          Descrição do produto.
                        </span>
                        <p 
                          className="text-[3px] leading-tight line-clamp-2 opacity-85"
                          style={{ color: middleTechInfoColor }}
                        >
                          Aromas frutados intensos, paladar macio com taninos maduros e final prolongado...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {middleShowFooter && (
                    <div 
                      className="border-t border-stone-800/10 py-0.5 px-2 mt-auto text-[2.5px] flex items-center justify-between"
                      style={{ color: middleFooterColor }}
                    >
                      <span className="truncate max-w-[70%]">Catálogo Allvino B2B. Vendas exclusivas no atacado.</span>
                      <span>1 / 10</span>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Contra Capa */}
              {previewTab === 'back' && (
                <div 
                  className={`w-full max-w-[200px] aspect-[9/16] rounded border p-4 shadow-2xl relative transition-all duration-300 overflow-hidden bg-cover bg-center ${
                    customBackCoverUrl ? 'border-stone-700' : `${activeTheme.bgColor} ${activeTheme.borderColor}`
                  }`}
                  style={customBackCoverUrl ? { backgroundImage: `url(${customBackCoverUrl})` } : undefined}
                >
                  {!customBackCoverUrl && (
                    <>
                      {/* Borda interna */}
                      <div className={`absolute inset-2.5 border pointer-events-none ${
                        selectedTheme === 'classic' ? 'border-white/100' :
                        selectedTheme === 'gold' ? 'border-gold-500/100' :
                        selectedTheme === 'clean' ? 'border-stone-800/100' : 'border-stone-700/100'
                      }`} />

                      {/* Obrigado/Allvino central */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                        <span className={`font-display text-lg font-bold tracking-display block ${activeTheme.textColor}`}>
                          ALLVINO
                        </span>
                        <span className={`text-[5px] font-serif italic mt-0.5 block ${activeTheme.textColor} opacity-80`}>
                          Obrigado pela preferência!
                        </span>
                      </div>
                    </>
                  )}

                  {/* Representante info */}
                  {backCoverShowInfo && (
                    <div 
                      className="absolute inset-x-0 text-center space-y-[1px] z-10 -translate-y-1/2"
                      style={{ 
                        top: `${(backCoverInfoY / 640) * 100}%`,
                        color: backCoverInfoColor
                      }}
                    >
                      <span className="text-[4.5px] font-bold block leading-tight">
                        Representante: Alessandro Silveira
                      </span>
                      <span className="text-[4px] font-mono block opacity-95">
                        Telefone/WhatsApp: (27) 99514-5536
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
