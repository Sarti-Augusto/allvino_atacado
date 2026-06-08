// =====================================================================
// Gerador de PDF — Allvino B2B Catalog
// Layout MOBILE-FIRST — otimizado para visualização em smartphones
//
// Formato  : 360 × 640 pt  (proporção 9:16 — preenche tela inteira)
// Unidade  : pt (pontos tipográficos)
// Margens  : 16 pt laterais | 24 pt superior/inferior
// Conteúdo : 328 × 592 pt
//
// Páginas de produto — layout HERO DOMINANTE:
//   • Header strip           (0   – 32 pt)
//   • GARRAFA hero full-w.   (32  – 362 pt)  ← 330 pt de altura (52%)
//   • Linha divisória        (366 pt)
//   • Nome + produtor        (372 – 402 pt)
//   • Badges (país/uva/tipo) (404 – 416 pt)
//   • Caixa de preço 2-col   (420 – 460 pt)
//   • Divisor + Descrição    (464 – 596 pt)
//   • Rodapé                 (600 – 620 pt)
//
// Compressão : JPEG 85 % para fotos | PNG para logos/ícones
// =====================================================================

import jsPDF from 'jspdf';
import type { SelectedWine } from '@/types/wine';

// ─── Constantes de layout (pt) ───────────────────────────────────────
const PAGE_W   = 360;
const PAGE_H   = 640;
const MX       = 16;          // margem lateral (compacta para maximizar conteúdo)
const MY       = 24;          // margem vertical
const CW       = PAGE_W - MX * 2;   // 328 pt — largura de conteúdo
const BLEED    = 4.0;         // Sangria de 4.0pt para transbordar a página e eliminar frestas/espaçamentos subpixel no mobile

// Faixa de cabeçalho (compacta)
const HDR_H    = 32;
const HDR_TY   = HDR_H * 0.66;

// ── HERO: garrafa full-width, ultra-proeminente ──
const IMG_W    = CW;          // 328 pt — ocupa toda a largura de conteúdo
const IMG_H    = 330;         // 330 pt de altura — hero dominante (~52% da página)
const IMG_X    = MX;          // alinhado à margem esquerda
const IMG_Y    = HDR_H;       // logo após o header

// Seção de info (abaixo do hero)
const INFO_Y   = IMG_Y + IMG_H + 4;   // ≈ 366 pt

// Caixa de preço (2 colunas, compacta)
const PRICE_H  = 40;

// Rodapé
const FTR_LINE = PAGE_H - MY + 2;    // 618 pt
const FTR_TY   = PAGE_H - MY + 12;   // 624 pt

// ─── Interfaces ──────────────────────────────────────────────────────
export interface PdfBranding {
  companyName?: string;
  logoDataUrl?: string;
  primaryColor?: string;
  phone?: string;
  email?: string;
  site?: string;
}

export interface PdfOptions extends PdfBranding {
  title?: string;
  subtitle?: string;
  footerMessage?: string;
  representativeName?: string;
  representativePhone?: string;
  minOrder?: string;
  deliveryTime?: string;
  freightInfo?: string;
  coverTheme?: string;
  customCoverUrl?: string;
  customMiddleUrl?: string;
  customBackCoverUrl?: string;
  customCoverDataUrl?: string | null;
  customMiddleDataUrl?: string | null;
  customBackCoverDataUrl?: string | null;
  coverShowRep?: boolean;
  coverRepY?: number;
  coverTextColor?: string;
  coverShowDate?: boolean;
  coverDateY?: number;
  middleShowHeader?: boolean;
  middleHeaderColor?: string;
  middleShowFooter?: boolean;
  middleFooterColor?: string;
  middleBgCards?: boolean;
  backCoverShowInfo?: boolean;
  backCoverInfoY?: number;
  backCoverInfoColor?: string;
  showBoxPrice?: boolean;
  boxPriceLabel?: string;
  showUnitPrice?: boolean;
  unitPriceLabel?: string;
  boxUnits?: number;
  showCountry?: boolean;
  showRegion?: boolean;
  showGrape?: boolean;
  showVintage?: boolean;
  showType?: boolean;
  showDescription?: boolean;
  middleProductNameColor?: string;
  middlePriceColor?: string;
  middleTechInfoColor?: string;
}

const DEFAULT_PRIMARY = '#A61C3C';

// ─── Utilitários ─────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return [166, 28, 60];
  return m.map((h) => parseInt(h, 16)) as [number, number, number];
}

const BRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Cache de URL → DataURL (evita re-download na mesma sessão)
const _imgCache = new Map<string, string>();
async function urlToDataUrl(url: string): Promise<string | null> {
  if (_imgCache.has(url)) return _imgCache.get(url)!;
  try {
    const res  = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const du   = await new Promise<string>((ok, err) => {
      const r  = new FileReader();
      r.onload  = () => ok(r.result as string);
      r.onerror = err;
      r.readAsDataURL(blob);
    });
    _imgCache.set(url, du);
    return du;
  } catch { return null; }
}

// Dimensões naturais de uma imagem a partir de DataURL
function getImageDimensions(du: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve({ w: 0, h: 0 }); return; }
    const img    = new Image();
    img.onload   = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror  = () => resolve({ w: 0, h: 0 });
    img.src      = du;
  });
}

// Remove bordas brancas/transparentes da imagem da garrafa
function trimWhitespace(du: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(du); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c   = document.createElement('canvas');
        c.width   = img.width; c.height = img.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const d   = ctx.getImageData(0, 0, c.width, c.height);
        let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
          const i = (y * c.width + x) * 4;
          const a = d.data[i + 3], r = d.data[i], g = d.data[i+1], b = d.data[i+2];
          if (a >= 10 && !(r > 248 && g > 248 && b > 248)) {
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
        }
        if (x1 < x0 || y1 < y0) { resolve(du); return; }
        const px = Math.round((x1 - x0) * 0.02), py = Math.round((y1 - y0) * 0.02);
        x0 = Math.max(0, x0 - px); y0 = Math.max(0, y0 - py);
        x1 = Math.min(c.width  - 1, x1 + px);
        y1 = Math.min(c.height - 1, y1 + py);
        const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
        const cc = document.createElement('canvas');
        cc.width = cw; cc.height = ch;
        cc.getContext('2d')!.drawImage(c, x0, y0, cw, ch, 0, 0, cw, ch);
        resolve(cc.toDataURL('image/png'));
      } catch { resolve(du); }
    };
    img.onerror = () => resolve(du);
    img.src = du;
  });
}

function wrap(doc: jsPDF, text: string, maxW: number): string[] {
  return doc.splitTextToSize(text, maxW) as string[];
}

// Desenha uma imagem em full-bleed (cobrindo 100% da página, sem distorção)
function fullBleed(
  doc: jsPDF,
  du: string,
  fmt: 'PNG' | 'JPEG',
  dims: { w: number; h: number } | null,
) {
  if (dims && dims.w > 0 && dims.h > 0) {
    const ir = dims.w / dims.h, pr = PAGE_W / PAGE_H;
    let dw = PAGE_W, dh = PAGE_H, dx = 0, dy = 0;
    if (ir > pr) { dw = PAGE_H * ir; dx = (PAGE_W - dw) / 2; }
    else         { dh = PAGE_W / ir; dy = (PAGE_H - dh) / 2; }
    doc.addImage(du, fmt, dx - BLEED, dy - BLEED, dw + BLEED * 2, dh + BLEED * 2, undefined, 'NONE');
  } else {
    doc.addImage(du, fmt, -BLEED, -BLEED, PAGE_W + BLEED * 2, PAGE_H + BLEED * 2, undefined, 'NONE');
  }
}

// ─── Tema de cores da capa ────────────────────────────────────────────
interface ThemeColors {
  bgR: number; bgG: number; bgB: number;
  brR: number; brG: number; brB: number;   // borda
  t1R: number; t1G: number; t1B: number;   // texto primário
  t2R: number; t2G: number; t2B: number;   // texto secundário
  bnR: number; bnG: number; bnB: number;   // gargalo
}
function getThemeColors(theme: string, rgb: [number, number, number]): ThemeColors {
  const [r, g, b] = rgb;
  if (theme === 'gold')
    return { bgR:11,bgG:9,bgB:10, brR:212,brG:175,brB:55, t1R:212,t1G:175,t1B:55, t2R:242,t2G:240,t2B:234, bnR:212,bnG:175,bnB:55 };
  if (theme === 'clean')
    return { bgR:250,bgG:249,bgB:246, brR:26,brG:22,brB:23, t1R:11,t1G:9,t1B:10, t2R:90,t2G:90,t2B:90, bnR:166,bnG:28,bnB:60 };
  if (theme === 'dark')
    return { bgR:11,bgG:9,bgB:10, brR:58,brG:53,brB:44, t1R:255,t1G:255,t1B:255, t2R:195,t2G:188,t2B:171, bnR:166,bnG:28,bnB:60 };
  // classic
  return { bgR:r,bgG:g,bgB:b, brR:255,brG:255,brB:255, t1R:255,t1G:255,t1B:255, t2R:255,t2G:255,t2B:255, bnR:212,bnG:175,bnB:55 };
}

// ─── CAPA ─────────────────────────────────────────────────────────────
function drawCover(doc: jsPDF, opts: PdfOptions, rgb: [number, number, number]) {
  const tc = getThemeColors(opts.coverTheme || 'classic', rgb);

  if (opts.customCoverDataUrl) {
    try {
      const fmt = opts.customCoverDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      fullBleed(doc, opts.customCoverDataUrl, fmt, (opts as any).customCoverDimensions ?? null);
    } catch {
      doc.setFillColor(tc.bgR, tc.bgG, tc.bgB);
      doc.rect(-BLEED, -BLEED, PAGE_W + BLEED * 2, PAGE_H + BLEED * 2, 'F');
    }
  } else {
    // Fundo sólido + borda interna
    doc.setFillColor(tc.bgR, tc.bgG, tc.bgB);
    doc.rect(-BLEED, -BLEED, PAGE_W + BLEED * 2, PAGE_H + BLEED * 2, 'F');
    doc.setDrawColor(tc.brR, tc.brG, tc.brB);
    doc.setLineWidth(0.7);
    doc.rect(16, 16, PAGE_W - 32, PAGE_H - 32, 'D');

    // Título ALLVINO
    doc.setTextColor(tc.t1R, tc.t1G, tc.t1B);
    doc.setFont('times', 'bold');
    doc.setFontSize(54);
    doc.text('ALLVINO', PAGE_W / 2, 130, { align: 'center' });

    // Gargalo acima do "I"
    const tw   = doc.getTextWidth('ALLVINO');
    const sx   = (PAGE_W - tw) / 2;
    const bnX  = sx + doc.getTextWidth('ALLV') + doc.getTextWidth('I') / 2;
    const bnY  = 130 - 18;
    doc.setFillColor(tc.bnR, tc.bnG, tc.bnB);
    doc.rect(bnX - 2, bnY - 10, 4, 11, 'F');
    doc.rect(bnX - 2.8, bnY - 10, 5.6, 2.2, 'F');

    // Subtítulo
    doc.setTextColor(tc.t2R, tc.t2G, tc.t2B);
    doc.setFont('times', 'normal');
    doc.setFontSize(14);
    doc.text('CATÁLOGO DE VINHOS EXCLUSIVOS • B2B', PAGE_W / 2, 150, { align: 'center' });

    // Linha divisória
    doc.setDrawColor(tc.brR, tc.brG, tc.brB);
    doc.setLineWidth(0.4);
    doc.line(PAGE_W / 2 - 55, 160, PAGE_W / 2 + 55, 160);

    // Título do catálogo
    doc.setFont('times', 'italic');
    doc.setFontSize(20);
    const tLines = wrap(doc, opts.title ?? 'Seleção B2B de Vinhos', CW - 30);
    doc.text(tLines, PAGE_W / 2, 180, { align: 'center' });
  }

  // Dados do representante
  if (opts.coverShowRep ?? true) {
    const tc2 = opts.coverTextColor ? hexToRgb(opts.coverTextColor) : [tc.t2R, tc.t2G, tc.t2B] as [number,number,number];
    doc.setTextColor(tc2[0], tc2[1], tc2[2]);
    const ry = opts.coverRepY ?? 390;
    doc.setFont('times', 'bold'); doc.setFontSize(14);
    doc.text('Apresentado por:', PAGE_W / 2, ry, { align: 'center' });
    doc.setFont('times', 'normal'); doc.setFontSize(17);
    doc.text(opts.representativeName || 'Allvino Comercial', PAGE_W / 2, ry + 14, { align: 'center' });
    let repY = ry + 26;
    if (opts.representativePhone || opts.phone) {
      doc.setFontSize(13);
      doc.text(`WhatsApp: ${opts.representativePhone || opts.phone}`, PAGE_W / 2, repY, { align: 'center' });
      repY += 12;
    }
    if (opts.email || opts.site) {
      doc.setFontSize(11);
      doc.text([opts.email, opts.site].filter(Boolean).join('  |  '), PAGE_W / 2, repY, { align: 'center' });
    }
  }

  // Data de geração
  if (opts.coverShowDate ?? true) {
    const tc3 = opts.coverTextColor ? hexToRgb(opts.coverTextColor) : [tc.t2R, tc.t2G, tc.t2B] as [number,number,number];
    doc.setTextColor(tc3[0], tc3[1], tc3[2]);
    doc.setFont('times', 'normal'); doc.setFontSize(11);
    const dy = opts.coverDateY ?? 610;
    const fd = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Gerado em ${fd}`, PAGE_W / 2, dy, { align: 'center' });
  }
}

// ─── CONTRA CAPA ─────────────────────────────────────────────────────
function drawBackCover(doc: jsPDF, opts: PdfOptions, rgb: [number, number, number]) {
  const tc = getThemeColors(opts.coverTheme || 'classic', rgb);

  if (opts.customBackCoverDataUrl) {
    try {
      const fmt = opts.customBackCoverDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      fullBleed(doc, opts.customBackCoverDataUrl, fmt, (opts as any).customBackCoverDimensions ?? null);
    } catch {
      doc.setFillColor(tc.bgR, tc.bgG, tc.bgB);
      doc.rect(-BLEED, -BLEED, PAGE_W + BLEED * 2, PAGE_H + BLEED * 2, 'F');
    }
  } else {
    doc.setFillColor(tc.bgR, tc.bgG, tc.bgB);
    doc.rect(-BLEED, -BLEED, PAGE_W + BLEED * 2, PAGE_H + BLEED * 2, 'F');
    doc.setDrawColor(tc.brR, tc.brG, tc.brB);
    doc.setLineWidth(0.7);
    doc.rect(16, 16, PAGE_W - 32, PAGE_H - 32, 'D');
    doc.setTextColor(tc.t1R, tc.t1G, tc.t1B);
    doc.setFont('times', 'bold'); doc.setFontSize(46);
    doc.text('ALLVINO', PAGE_W / 2, PAGE_H / 2 - 30, { align: 'center' });
    doc.setTextColor(tc.t2R, tc.t2G, tc.t2B);
    doc.setFont('times', 'italic'); doc.setFontSize(18);
    doc.text('Obrigado pela preferência!', PAGE_W / 2, PAGE_H / 2, { align: 'center' });
  }

  // Contato do representante
  if (opts.backCoverShowInfo ?? true) {
    const tc4 = opts.backCoverInfoColor ? hexToRgb(opts.backCoverInfoColor) : [tc.t2R, tc.t2G, tc.t2B] as [number,number,number];
    doc.setTextColor(tc4[0], tc4[1], tc4[2]);
    const defY = opts.customBackCoverDataUrl ? 480 : PAGE_H / 2 + 60;
    let cy = opts.backCoverInfoY ?? defY;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    if (opts.representativeName) { 
      doc.text(`Representante: ${opts.representativeName}`, PAGE_W / 2, cy, { align: 'center' }); 
      cy += 15; 
    }
    if (opts.representativePhone || opts.phone) {
      doc.text(`Telefone/WhatsApp: ${opts.representativePhone || opts.phone}`, PAGE_W / 2, cy, { align: 'center' });
    }
  }
}

// ─── PLACEHOLDER (sem imagem) ────────────────────────────────────────
function placeholder(doc: jsPDF) {
  // Box com gradiente simulado (fundo creme + moldura)
  doc.setFillColor(245, 241, 234);
  doc.setDrawColor(210, 200, 188);
  doc.rect(IMG_X, IMG_Y, IMG_W, IMG_H, 'FD');
  doc.setFont('helvetica', 'italic'); doc.setFontSize(12);
  doc.setTextColor(190, 185, 178);
  doc.text('Sem imagem', PAGE_W / 2, IMG_Y + IMG_H / 2, { align: 'center', baseline: 'middle' });
}

// ─── PÁGINA DE PRODUTO — LAYOUT HERO DOMINANTE MOBILE-FIRST ──────────
//
//  ┌────────────────────────────────────┐  0 pt
//  │  PRODUTO 01/05          ALLVINO    │  header (32 pt, compacto)
//  ├────────────────────────────────────┤  32 pt
//  │                                    │
//  │   ┌──────────────────────────────┐ │
//  │   │                              │ │
//  │   │                              │ │  HERO: garrafa full-width
//  │   │       [ GARRAFA ]            │ │  328 × 330 pt (52% da página)
//  │   │                              │ │  (fundo creme premium)
//  │   │                              │ │
//  │   └──────────────────────────────┘ │
//  ├────────────────────────────────────┤  362 pt
//  │  ─────────────────────────────────  │  divisor fino
//  │  Nome do Vinho (bold 16pt)         │
//  │  Produtor (10pt muted)             │
//  │  [País] [Uva] [Safra] [Tipo]       │  badges pill compactos
//  │  ┌──────────────┬─────────────────┐ │
//  │  │ UNIT R$XX,XX │ CX R$XXX,XX    │ │  preço 2-col (40pt)
//  │  └──────────────┴─────────────────┘ │
//  │  ─────────────────────────────────  │  divisor
//  │  Descrição | Ficha Técnica         │
//  ├────────────────────────────────────┤  618 pt
//  │  footer text              Pag X/Y  │  624 pt
//  └────────────────────────────────────┘  640 pt
//
async function drawProductPage(
  doc: jsPDF,
  wine: SelectedWine,
  dataUrl: string | null,
  idx: number,
  total: number,
  rgb: [number, number, number],
  opts: PdfOptions,
) {
  const [r, g, b] = rgb;

  // ── Fundo da página (branco quente) ──
  doc.setFillColor(255, 254, 252);
  doc.rect(-BLEED, -BLEED, PAGE_W + BLEED * 2, PAGE_H + BLEED * 2, 'F');

  // ── Fundo customizado (meio) ──
  if (opts.customMiddleDataUrl) {
    try {
      const fmt = opts.customMiddleDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      fullBleed(doc, opts.customMiddleDataUrl, fmt, (opts as any).customMiddleDimensions ?? null);
    } catch { /* ignora */ }
  }

  // ─────────────────────────────────────────────────────────────────────
  // HEADER STRIP (compacto — 32pt)
  // ─────────────────────────────────────────────────────────────────────
  const showHdr = opts.middleShowHeader ?? true;
  if (showHdr) {
    doc.setFillColor(r, g, b);
    doc.rect(-BLEED, -BLEED, PAGE_W + BLEED * 2, HDR_H + BLEED, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(
      `PRODUTO ${String(idx).padStart(2,'0')} / ${String(total).padStart(2,'0')}`,
      MX, HDR_TY,
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('ALLVINO B2B', PAGE_W - MX, HDR_TY, { align: 'right' });
  }

  // ─────────────────────────────────────────────────────────────────────
  // HERO — GARRAFA FULL-WIDTH (330pt de altura — dominante)
  // ─────────────────────────────────────────────────────────────────────
  const useBg = opts.middleBgCards ?? true;

  // Box de fundo da garrafa — full-width, creme premium
  if (useBg) {
    doc.setFillColor(248, 244, 237);
    doc.setDrawColor(225, 215, 200);
    doc.setLineWidth(0.4);
    doc.rect(IMG_X, IMG_Y, IMG_W, IMG_H, 'FD');

    // Barra de textura sutil no topo do hero
    doc.setFillColor(240, 234, 224);
    doc.rect(IMG_X, IMG_Y, IMG_W, 5, 'F');
  }

  // Imagem da garrafa — centralizada e maximizada dentro do hero
  if (dataUrl) {
    try {
      const fmt  = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      const dims = await getImageDimensions(dataUrl);

      // Padding interno mínimo para maximizar a garrafa
      const padH = 6, padV = 8;
      let dw = IMG_W - padH * 2;
      let dh = IMG_H - padV * 2;

      if (dims.w > 0 && dims.h > 0) {
        const ir = dims.w / dims.h;
        const br = dw / dh;
        if (ir > br) { dh = dw / ir; }   // imagem mais larga: limita largura
        else         { dw = dh * ir; }   // imagem mais alta: limita altura
      }

      const dx = IMG_X + (IMG_W - dw) / 2;
      const dy = IMG_Y + (IMG_H - dh) / 2;
      doc.addImage(dataUrl, fmt, dx, dy, dw, dh, undefined, 'NONE');
    } catch { placeholder(doc); }
  } else {
    placeholder(doc);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SEÇÃO DE INFORMAÇÕES (compacta — otimizada para espaço restante)
  // ─────────────────────────────────────────────────────────────────────
  let cy = INFO_Y + 4;

  // ── Nome do vinho (compacto) ──
  if (opts.middleProductNameColor) {
    const c = hexToRgb(opts.middleProductNameColor);
    doc.setTextColor(c[0], c[1], c[2]);
  } else {
    doc.setTextColor(18, 16, 14);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const nameLines = wrap(doc, wine.nome, CW);
  doc.text(nameLines, MX, cy);
  cy += nameLines.length * 10;

  // ── Produtor ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (opts.middleProductNameColor) {
    const c = hexToRgb(opts.middleProductNameColor);
    doc.setTextColor(c[0], c[1], c[2]);
  } else {
    doc.setTextColor(100, 95, 88);
  }
  doc.text(wine.produtor, MX, cy);
  cy += 8;

  // ── Badges de atributos (pills compactos) ──
  const typeMap: Record<string, string> = {
    Tinto: 'Tinto', Branco: 'Branco', Rose: 'Rosé',
    Espumante: 'Espumante', Fortificado: 'Fortificado', Licoroso: 'Licoroso',
  };
  const badges: string[] = [];
  if ((opts.showCountry ?? true) && wine.pais) {
    badges.push(wine.pais);
  }
  if ((opts.showRegion ?? true) && wine.regiao) {
    badges.push(wine.regiao);
  }
  if ((opts.showGrape ?? true) && wine.uva_varietal) {
    badges.push(wine.uva_varietal);
  }
  if ((opts.showVintage ?? true) && wine.safra) {
    badges.push(`${wine.safra}`);
  }
  if ((opts.showType ?? true) && wine.tipo) {
    badges.push(typeMap[wine.tipo] || wine.tipo);
  }

  if (badges.length > 0) {
    const BADGE_H   = 12;
    const BADGE_PAD = 5;
    const BADGE_R   = 2.5;
    const BADGE_GAP = 3;
    let bx = MX;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');

    const badgeBg = opts.middleTechInfoColor ? hexToRgb(opts.middleTechInfoColor) : [r, g, b];
    const brightness = (badgeBg[0] * 299 + badgeBg[1] * 587 + badgeBg[2] * 114) / 1000;
    const badgeTextColor = brightness > 150 ? [18, 16, 14] : [255, 255, 255];

    for (const badge of badges) {
      const bw = doc.getTextWidth(badge) + BADGE_PAD * 2;
      if (bx + bw > PAGE_W - MX) { bx = MX; cy += BADGE_H + BADGE_GAP; }
      // Fundo do badge
      doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
      doc.roundedRect(bx, cy, bw, BADGE_H, BADGE_R, BADGE_R, 'F');
      // Texto do badge
      doc.setTextColor(badgeTextColor[0], badgeTextColor[1], badgeTextColor[2]);
      doc.text(badge, bx + BADGE_PAD, cy + BADGE_H - 3.5);
      bx += bw + BADGE_GAP;
    }
    cy += BADGE_H + 6;
  } else {
    cy += 3;
  }

  // ── Caixa de preço (2 colunas / dinâmica — compacta) ──
  const showBox = opts.showBoxPrice ?? true;
  const showUnit = opts.showUnitPrice ?? false;
  const boxUnitsVal = wine.caixa_fechada_qnt || opts.boxUnits || 6;
  const unitPriceVal = wine.preco_atacado; // preco_atacado é o preço unitário
  const boxPriceVal = wine.preco_atacado * boxUnitsVal; // preço da caixa calculada

  if (showBox || showUnit) {
    const customPriceRgb: [number, number, number] = opts.middlePriceColor ? hexToRgb(opts.middlePriceColor) : [r, g, b];

    if (useBg) {
      doc.setFillColor(customPriceRgb[0], customPriceRgb[1], customPriceRgb[2]);
      doc.roundedRect(MX, cy, CW, PRICE_H, 4, 4, 'F');
    } else {
      doc.setDrawColor(customPriceRgb[0], customPriceRgb[1], customPriceRgb[2]);
      doc.setLineWidth(0.8);
      doc.roundedRect(MX, cy, CW, PRICE_H, 4, 4, 'D');
    }

    let priceColor: [number, number, number];
    let labelColor: [number, number, number];

    if (useBg) {
      // Se for fundo preenchido, o texto deve contrastar com a cor de fundo
      const bgBrightness = (customPriceRgb[0] * 299 + customPriceRgb[1] * 587 + customPriceRgb[2] * 114) / 1000;
      if (bgBrightness > 150) {
        priceColor = [18, 16, 14];
        labelColor = [80, 75, 70];
      } else {
        priceColor = [255, 255, 255];
        labelColor = [255, 220, 205];
      }
    } else {
      // Se for outline, o texto usa a cor customizada
      priceColor = customPriceRgb;
      labelColor = customPriceRgb;
    }

    if (showBox && showUnit) {
      // Divisor vertical
      doc.setDrawColor(labelColor[0], labelColor[1], labelColor[2]);
      doc.setLineWidth(0.4);
      doc.line(PAGE_W / 2, cy + 5, PAGE_W / 2, cy + PRICE_H - 5);

      // --- Coluna 1: Unitário ---
      doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(opts.unitPriceLabel || 'PREÇO UNITÁRIO', MX + 8, cy + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.text('(GARRAFA)', MX + 8, cy + 16);

      doc.setTextColor(priceColor[0], priceColor[1], priceColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(BRL(unitPriceVal), MX + 8, cy + PRICE_H - 7);

      // --- Coluna 2: Atacado/Caixa ---
      doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(opts.boxPriceLabel || 'PREÇO DA CAIXA', PAGE_W / 2 + 8, cy + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.text(`(CX ${boxUnitsVal} UN)`, PAGE_W / 2 + 8, cy + 16);

      doc.setTextColor(priceColor[0], priceColor[1], priceColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(BRL(boxPriceVal), PAGE_W / 2 + 8, cy + PRICE_H - 7);

    } else if (showUnit) {
      // Apenas unitário — layout horizontal
      doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(opts.unitPriceLabel || 'PREÇO UNITÁRIO', MX + 10, cy + 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('(GARRAFA INDIVIDUAL)', MX + 10, cy + 22);

      doc.setTextColor(priceColor[0], priceColor[1], priceColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(BRL(unitPriceVal), PAGE_W - MX - 8, cy + PRICE_H / 2 + 4, { align: 'right' });

    } else {
      // Apenas atacado (Caixa) — layout horizontal
      doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(opts.boxPriceLabel || 'PREÇO DA CAIXA', MX + 10, cy + 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text(`(CAIXA C/ ${boxUnitsVal} UNIDADES)`, MX + 10, cy + 22);

      doc.setTextColor(priceColor[0], priceColor[1], priceColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(BRL(boxPriceVal), PAGE_W - MX - 8, cy + PRICE_H / 2 + 4, { align: 'right' });
    }

    cy += PRICE_H + 6;
  }

  // ─────────────────────────────────────────────────────────────────────
  // DESCRIÇÃO / FICHA TÉCNICA
  // ─────────────────────────────────────────────────────────────────────
  if (opts.showDescription ?? true) {
    cy += 4;

    // Título
    if (opts.middleTechInfoColor) {
      const c = hexToRgb(opts.middleTechInfoColor);
      doc.setTextColor(c[0], c[1], c[2]);
    } else {
      doc.setTextColor(18, 16, 14);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Descrição do produto.', MX, cy);
    cy += 10;

    // Texto da descrição — renderizado linha a linha com espaçamento controlado
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    if (opts.middleTechInfoColor) {
      const c = hexToRgb(opts.middleTechInfoColor);
      doc.setTextColor(c[0], c[1], c[2]);
    } else {
      doc.setTextColor(55, 52, 48);
    }
    const desc     = wine.ficha_tecnica_detalhada ?? 'Descrição comercial indisponível. Consulte nosso representante.';
    const allLines = wrap(doc, desc, CW);
    const LINE_H   = 10;   // espaçamento explícito entre linhas (1.18× font 8.5pt)
    const maxLines = Math.floor((FTR_LINE - cy - 4) / LINE_H);
    const linesToDraw = allLines.slice(0, Math.max(0, maxLines));
    for (let li = 0; li < linesToDraw.length; li++) {
      doc.text(linesToDraw[li], MX, cy + li * LINE_H);
    }
  }
}

// ─── Rodapé nas páginas internas ─────────────────────────────────────
function drawFooter(doc: jsPDF, pageNum: number, pageTotal: number, opts: PdfOptions) {
  doc.setDrawColor(210, 205, 200); doc.setLineWidth(0.4);
  doc.line(MX, FTR_LINE, PAGE_W - MX, FTR_LINE);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  if (opts.middleFooterColor) { const c = hexToRgb(opts.middleFooterColor); doc.setTextColor(c[0],c[1],c[2]); }
  else doc.setTextColor(145, 145, 145);
  const footer = opts.footerMessage ?? 'Sujeito a disponibilidade de estoque. Vendas exclusivas no atacado.';
  const fLines = wrap(doc, footer, CW - 70);
  doc.text(fLines, MX, FTR_TY);
  doc.text(`${pageNum} / ${pageTotal}`, PAGE_W - MX, FTR_TY, { align: 'right' });
}

// ─── Pré-carga e extração de dimensões ───────────────────────────────
async function loadTemplates(opts: PdfOptions) {
  const [cov, mid, bck] = await Promise.all([
    opts.customCoverUrl     ? urlToDataUrl(opts.customCoverUrl)     : Promise.resolve(null),
    opts.customMiddleUrl    ? urlToDataUrl(opts.customMiddleUrl)    : Promise.resolve(null),
    opts.customBackCoverUrl ? urlToDataUrl(opts.customBackCoverUrl) : Promise.resolve(null),
  ]);
  opts.customCoverDataUrl     = cov;
  opts.customMiddleDataUrl    = mid;
  opts.customBackCoverDataUrl = bck;

  const [d1, d2, d3] = await Promise.all([
    cov ? getImageDimensions(cov) : Promise.resolve(null),
    mid ? getImageDimensions(mid) : Promise.resolve(null),
    bck ? getImageDimensions(bck) : Promise.resolve(null),
  ]);
  (opts as any).customCoverDimensions     = d1;
  (opts as any).customMiddleDimensions    = d2;
  (opts as any).customBackCoverDimensions = d3;
}

function buildDoc(opts: PdfOptions): [jsPDF, [number,number,number]] {
  const theme = opts.coverTheme || 'classic';
  let primary = DEFAULT_PRIMARY;
  if (theme === 'gold') primary = '#D4AF37';
  if (theme === 'dark') primary = '#1A1617';
  const branding = { primaryColor: primary, companyName: 'Allvino', ...opts };
  const rgb = hexToRgb(branding.primaryColor);
  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'portrait' });
  return [doc, rgb];
}

// ─── EXPORTAÇÃO 1: sem imagens das garrafas (rápido) ─────────────────
export async function generateCatalogPdf(
  wines: SelectedWine[],
  opts: PdfOptions = {},
): Promise<Blob> {
  await loadTemplates(opts);
  const [doc, rgb] = buildDoc(opts);

  // Capa
  drawCover(doc, opts, rgb);

  // Páginas de produto (sem imagem)
  for (let i = 0; i < wines.length; i++) {
    doc.addPage([PAGE_W, PAGE_H], 'portrait');
    await drawProductPage(doc, wines[i], null, i + 1, wines.length, rgb, opts);
  }

  // Contra Capa
  doc.addPage([PAGE_W, PAGE_H], 'portrait');
  drawBackCover(doc, opts, rgb);

  // Rodapés
  if (opts.middleShowFooter ?? true) {
    const pc = doc.getNumberOfPages();
    for (let p = 2; p < pc; p++) {
      doc.setPage(p);
      drawFooter(doc, p - 1, pc - 2, opts);
    }
  }

  return doc.output('blob');
}

// ─── EXPORTAÇÃO 2: com imagens das garrafas (padrão) ─────────────────
export async function generateCatalogPdfWithImages(
  wines: SelectedWine[],
  opts: PdfOptions = {},
): Promise<Blob> {
  // 1) Busca e recorta imagens das garrafas em paralelo
  const raw = await Promise.all(
    wines.map((w) => w.imagem_url ? urlToDataUrl(w.imagem_url) : Promise.resolve(null)),
  );
  const dataUrls = await Promise.all(
    raw.map((u) => u ? trimWhitespace(u) : Promise.resolve(null)),
  );

  // 2) Pré-carrega templates
  await loadTemplates(opts);
  const [doc, rgb] = buildDoc(opts);

  // 3) Capa
  drawCover(doc, opts, rgb);

  // 4) Páginas de produto com imagem
  for (let i = 0; i < wines.length; i++) {
    doc.addPage([PAGE_W, PAGE_H], 'portrait');
    await drawProductPage(doc, wines[i], dataUrls[i], i + 1, wines.length, rgb, opts);
  }

  // 5) Contra Capa
  doc.addPage([PAGE_W, PAGE_H], 'portrait');
  drawBackCover(doc, opts, rgb);

  // 6) Rodapés nas páginas internas (exclui capa=1 e contra-capa=last)
  if (opts.middleShowFooter ?? true) {
    const pc = doc.getNumberOfPages();
    for (let p = 2; p < pc; p++) {
      doc.setPage(p);
      drawFooter(doc, p - 1, pc - 2, opts);
    }
  }

  return doc.output('blob');
}

// ─── Helper de download (browser) ────────────────────────────────────
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
