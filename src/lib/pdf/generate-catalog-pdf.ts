// =====================================================================
// Gerador de PDF - Catalogo B2B personalizado
// Stack: jsPDF + jspdf-autotable (funciona 100% no browser)
// - Capa Premium Allvino + data
// - Sumario agrupado por tipo com Condições Comerciais na Página 2
// - Cards por vinho (imagem, nome, produtor, preco, ficha)
// - Performance: converte imagem remota -> dataURL uma unica vez
// =====================================================================
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SelectedWine } from '@/types/wine';

export interface PdfBranding {
  companyName?: string;
  logoDataUrl?: string;     // opcional: PNG/JPG ja em base64
  primaryColor?: string;    // hex, ex: '#A61C3C'
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
}

const DEFAULT_BRANDING: Required<Omit<PdfBranding, 'logoDataUrl' | 'phone' | 'email' | 'site'>> = {
  companyName: 'Allvino',
  primaryColor: '#A61C3C',
};

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return [166, 28, 60]; // fallback #A61C3C
  return m.map((h) => parseInt(h, 16)) as [number, number, number];
}

const BRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Converte uma URL de imagem em DataURL (necessario para o jsPDF)
// Cache por URL para nao baixar duas vezes no mesmo PDF
const imageCache = new Map<string, string>();
async function urlToDataUrl(url: string): Promise<string | null> {
  if (imageCache.has(url)) return imageCache.get(url)!;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    imageCache.set(url, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}

// Encapsula um texto longo em múltiplas linhas respeitando maxWidth
function splitLines(
  doc: jsPDF,
  text: string,
  maxWidth: number,
): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

// ---------- HELPER: DESENHAR CAPA ----------
function drawCoverPage(
  doc: jsPDF,
  options: PdfOptions,
  rgb: [number, number, number],
  pageW: number,
  pageH: number,
  contentW: number,
  margin: number
) {
  const [r, g, b] = rgb;

  // Fundo Bordô / Escuro
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Detalhe geométrico elegante: borda fina branca
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.rect(12, 12, pageW - 24, pageH - 24, 'D');

  // Título Principal
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.text('ALLVINO', pageW / 2, 75, { align: 'center' });

  // Subtítulo da Marca
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text('CATÁLOGO DE VINHOS EXCLUSIVOS • B2B', pageW / 2, 85, { align: 'center' });

  // Linha divisória
  doc.setDrawColor(255, 255, 255);
  doc.line(pageW / 2 - 25, 93, pageW / 2 + 25, 93);

  // Título Customizado do Catálogo
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(16);
  const titleText = options.title ?? 'Seleção B2B de Vinhos';
  const titleLines = splitLines(doc, titleText, contentW - 20);
  doc.text(titleLines, pageW / 2, 110, { align: 'center' });

  // Bloco de Informações do Representante (Inferior)
  const boxY = 175;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Apresentado por:', pageW / 2, boxY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  let repY = boxY + 7;
  
  const repName = options.representativeName || 'Allvino Comercial';
  doc.text(repName, pageW / 2, repY, { align: 'center' });
  repY += 6;

  if (options.representativePhone) {
    doc.setFontSize(10);
    doc.text(`WhatsApp: ${options.representativePhone}`, pageW / 2, repY, { align: 'center' });
    repY += 6;
  } else if (options.phone) {
    doc.setFontSize(10);
    doc.text(`WhatsApp: ${options.phone}`, pageW / 2, repY, { align: 'center' });
    repY += 6;
  }

  // Email e Site
  if (options.email || options.site) {
    doc.setFontSize(9);
    const parts = [options.email, options.site].filter(Boolean);
    doc.text(parts.join('  |  '), pageW / 2, repY, { align: 'center' });
  }

  // Data de geração
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const formattedDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Gerado em ${formattedDate}`, pageW / 2, pageH - 22, { align: 'center' });
}

// ---------- HELPER: DESENHAR SUMÁRIO ----------
function drawSummaryPage(
  doc: jsPDF,
  wines: SelectedWine[],
  options: PdfOptions,
  rgb: [number, number, number],
  pageW: number,
  pageH: number,
  contentW: number,
  margin: number
) {
  const [r, g, b] = rgb;

  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Resumo do Catálogo', margin, 24);

  // Agrupar os vinhos por tipo
  const grouped: Record<string, SelectedWine[]> = {};
  for (const w of wines) {
    const type = w.tipo || 'Outros';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(w);
  }

  const typeLabels: Record<string, string> = {
    Tinto: 'Vinhos Tintos',
    Branco: 'Vinhos Brancos',
    Rose: 'Vinhos Rosés',
    Espumante: 'Espumantes',
    Fortificado: 'Vinhos Fortificados',
    Licoroso: 'Vinhos Licorosos',
    Outros: 'Outros Rótulos',
  };

  const body: any[] = [];
  let idx = 1;
  const wineTypesOrder = ['Tinto', 'Branco', 'Rose', 'Espumante', 'Fortificado', 'Licoroso', 'Outros'];

  // Agrupar e construir linhas da tabela
  for (const type of wineTypesOrder) {
    const items = grouped[type] || [];
    if (items.length === 0) continue;
    
    // Linha de seção
    const label = typeLabels[type] || type.toUpperCase();
    body.push([{ content: label, colSpan: 6, styles: { fillColor: [248, 245, 240], fontStyle: 'bold', textColor: [r, g, b] } }]);
    
    for (const w of items) {
      body.push([
        String(idx++),
        w.nome,
        w.produtor,
        w.pais,
        w.safra ? String(w.safra) : '-',
        BRL(w.preco_atacado),
      ]);
    }
  }

  // Outros tipos eventuais
  for (const type of Object.keys(grouped)) {
    if (wineTypesOrder.includes(type)) continue;
    const items = grouped[type] || [];
    body.push([{ content: type.toUpperCase(), colSpan: 6, styles: { fillColor: [248, 245, 240], fontStyle: 'bold', textColor: [r, g, b] } }]);
    for (const w of items) {
      body.push([
        String(idx++),
        w.nome,
        w.produtor,
        w.pais,
        w.safra ? String(w.safra) : '-',
        BRL(w.preco_atacado),
      ]);
    }
  }

  autoTable(doc, {
    startY: 30,
    head: [['#', 'Vinho', 'Produtor', 'País', 'Safra', 'Preço (caixa)']],
    body: body,
    headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2.2 },
    alternateRowStyles: { fillColor: [253, 252, 250] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  const endY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90;

  // Total destacado
  const total = wines.reduce((acc, w) => acc + w.preco_atacado, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setFillColor(r, g, b);
  doc.rect(margin, endY + 4, contentW, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(`Total estimado da seleção: ${BRL(total)} (${wines.length} ${wines.length === 1 ? 'item' : 'itens'})`, pageW / 2, endY + 9.8, { align: 'center' });

  // Termos Comerciais Box
  const termsY = endY + 18;
  if (options.minOrder || options.deliveryTime || options.freightInfo) {
    let currentTermsY = termsY;
    if (currentTermsY + 28 > pageH - 15) {
      doc.addPage();
      currentTermsY = 20;
    }

    doc.setFillColor(248, 245, 240);
    doc.setDrawColor(230, 225, 220);
    doc.roundedRect(margin, currentTermsY, contentW, 28, 2, 2, 'FD');

    doc.setTextColor(r, g, b);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('CONDIÇÕES COMERCIAIS & LOGÍSTICAS', margin + 6, currentTermsY + 6);

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    let lineY = currentTermsY + 12;
    if (options.minOrder) {
      doc.setFont('helvetica', 'bold');
      doc.text('Pedido Mínimo:', margin + 6, lineY);
      doc.setFont('helvetica', 'normal');
      doc.text(options.minOrder, margin + 35, lineY);
      lineY += 4.5;
    }
    if (options.deliveryTime) {
      doc.setFont('helvetica', 'bold');
      doc.text('Prazo de Entrega:', margin + 6, lineY);
      doc.setFont('helvetica', 'normal');
      doc.text(options.deliveryTime, margin + 35, lineY);
      lineY += 4.5;
    }
    if (options.freightInfo) {
      doc.setFont('helvetica', 'bold');
      doc.text('Frete:', margin + 6, lineY);
      doc.setFont('helvetica', 'normal');
      doc.text(options.freightInfo, margin + 35, lineY);
    }
  }
}

// ---------- GERAÇÃO DO PDF ----------
export async function generateCatalogPdf(
  wines: SelectedWine[],
  options: PdfOptions = {},
): Promise<Blob> {
  const branding = { ...DEFAULT_BRANDING, ...options };
  const rgb = hexToRgb(branding.primaryColor);
  const [r, g, b] = rgb;

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  // 1) Capa
  drawCoverPage(doc, options, rgb, pageW, pageH, contentW, margin);

  // 2) Sumário
  doc.addPage();
  drawSummaryPage(doc, wines, options, rgb, pageW, pageH, contentW, margin);

  // 3) Páginas de Vinhos
  for (let i = 0; i < wines.length; i++) {
    const w = wines[i];
    doc.addPage();
    drawWinePage(doc, w, i + 1, wines.length, { r, g, b }, margin, contentW, pageH);
  }

  // 4) Rodapé em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const footer = options.footerMessage ?? 'Catálogo sujeito a disponibilidade de estoque. Vendas exclusivas no atacado.';
    doc.text(footer, margin, pageH - 7);
    doc.text(`Página ${p} de ${pageCount}`, pageW - margin, pageH - 7, { align: 'right' });
  }

  return doc.output('blob');
}

// ---------- DESENHAR PÁGINA INDIVIDUAL DE VINHO ----------
function drawWinePage(
  doc: jsPDF,
  w: SelectedWine,
  idx: number,
  total: number,
  rgb: { r: number; g: number; b: number },
  margin: number,
  contentW: number,
  pageH: number,
) {
  const { r, g, b } = rgb;

  // Faixa de título estilizada Allvino (Bordô)
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`PRODUTO ${idx.toString().padStart(2, '0')} DE ${total.toString().padStart(2, '0')}`, margin, 11);

  // Imagem
  const imgX = margin;
  const imgY = 28;
  const imgW = 60;
  const imgH = 90;

  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(248, 245, 240);
  doc.rect(imgX, imgY, imgW, imgH, 'FD');

  // Info ao lado
  const textX = imgX + imgW + 8;
  let cursorY = imgY + 6;

  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const nameLines = splitLines(doc, w.nome, contentW - imgW - 8);
  doc.text(nameLines, textX, cursorY);
  cursorY += nameLines.length * 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(w.produtor, textX, cursorY);
  cursorY += 6;

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  
  const typeLabelMap: Record<string, string> = {
    Tinto: 'Vinho Tinto',
    Branco: 'Vinho Branco',
    Rose: 'Vinho Rosé',
    Espumante: 'Espumante',
    Fortificado: 'Vinho Fortificado',
    Licoroso: 'Vinho Licoroso',
  };
  const translatedType = typeLabelMap[w.tipo] || w.tipo;

  const meta = [
    w.pais,
    w.regiao ?? null,
    w.uva_varietal ?? null,
    w.safra ? `Safra ${w.safra}` : null,
    translatedType,
  ].filter(Boolean).join('  -  ');
  doc.text(meta, textX, cursorY);
  cursorY += 8;

  // Preço em destaque
  doc.setFillColor(248, 245, 240);
  doc.roundedRect(textX, cursorY, contentW - imgW - 8, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('PREÇO DE ATACADO (CAIXA)', textX + 4, cursorY + 6);
  doc.setFontSize(16);
  doc.setTextColor(r, g, b);
  doc.text(BRL(w.preco_atacado), textX + 4, cursorY + 16);

  // Ficha técnica detalhada
  let fichaY = imgY + imgH + 10;
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Descrição Comercial e Notas', margin, fichaY);
  fichaY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const desc = w.ficha_tecnica_detalhada ?? 'Descrição comercial indisponível. Consulte nosso representante.';
  const lines = splitLines(doc, desc, contentW);
  doc.text(lines, margin, fichaY);
}

// ---------- GERAÇÃO DO PDF COM IMAGENS REALIZADAS ----------
export async function generateCatalogPdfWithImages(
  wines: SelectedWine[],
  options: PdfOptions = {},
): Promise<Blob> {
  // 1) Pre-converte todas as imagens em paralelo (cache de dataURL incluído)
  const dataUrls = await Promise.all(
    wines.map((w) => (w.imagem_url ? urlToDataUrl(w.imagem_url) : Promise.resolve(null))),
  );

  const branding = { ...DEFAULT_BRANDING, ...options };
  const rgb = hexToRgb(branding.primaryColor);
  const [r, g, b] = rgb;

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  // 1) Capa
  drawCoverPage(doc, options, rgb, pageW, pageH, contentW, margin);

  // 2) Sumário
  doc.addPage();
  drawSummaryPage(doc, wines, options, rgb, pageW, pageH, contentW, margin);

  // 3) Páginas de Produto
  for (let i = 0; i < wines.length; i++) {
    const w = wines[i];
    const dataUrl = dataUrls[i];
    doc.addPage();

    // Faixa
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`PRODUTO ${String(i + 1).padStart(2, '0')} DE ${wines.length.toString().padStart(2, '0')}`, margin, 11);

    // Imagem
    const imgX = margin, imgY = 28, imgW = 60, imgH = 90;
    if (dataUrl) {
      try {
        const format = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(dataUrl, format, imgX, imgY, imgW, imgH, undefined, 'FAST');
      } catch {
        drawPlaceholder(doc, imgX, imgY, imgW, imgH);
      }
    } else {
      drawPlaceholder(doc, imgX, imgY, imgW, imgH);
    }

    // Texto de Informações do Vinho
    const textX = imgX + imgW + 8;
    let cursorY = imgY + 6;
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const nameLines = splitLines(doc, w.nome, contentW - imgW - 8);
    doc.text(nameLines, textX, cursorY);
    cursorY += nameLines.length * 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(90, 90, 90);
    doc.text(w.produtor, textX, cursorY);
    cursorY += 6;
    
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);

    const typeLabelMap: Record<string, string> = {
      Tinto: 'Vinho Tinto',
      Branco: 'Vinho Branco',
      Rose: 'Vinho Rosé',
      Espumante: 'Espumante',
      Fortificado: 'Vinho Fortificado',
      Licoroso: 'Vinho Licoroso',
    };
    const translatedType = typeLabelMap[w.tipo] || w.tipo;

    const meta = [w.pais, w.regiao ?? null, w.uva_varietal ?? null, w.safra ? `Safra ${w.safra}` : null, translatedType]
      .filter(Boolean).join('  -  ');
    doc.text(meta, textX, cursorY);
    cursorY += 8;

    // Preço
    doc.setFillColor(248, 245, 240);
    doc.roundedRect(textX, cursorY, contentW - imgW - 8, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('PREÇO DE ATACADO (CAIXA)', textX + 4, cursorY + 6);
    doc.setFontSize(16);
    doc.setTextColor(r, g, b);
    doc.text(BRL(w.preco_atacado), textX + 4, cursorY + 16);

    // Ficha
    let fichaY = imgY + imgH + 10;
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Descrição Comercial e Notas', margin, fichaY);
    fichaY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const desc = w.ficha_tecnica_detalhada ?? 'Descrição comercial indisponível. Consulte nosso representante.';
    const lines = splitLines(doc, desc, contentW);
    doc.text(lines, margin, fichaY);
  }

  // 4) Rodapé em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const footer = options.footerMessage ?? 'Catálogo sujeito a disponibilidade de estoque. Vendas exclusivas no atacado.';
    doc.text(footer, margin, pageH - 7);
    doc.text(`Página ${p} de ${pageCount}`, pageW - margin, pageH - 7, { align: 'right' });
  }

  return doc.output('blob');
}

function drawPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(248, 245, 240);
  doc.rect(x, y, w, h, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text('Sem imagem', x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' });
}

// Helper de download (browser)
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // libera memoria
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
