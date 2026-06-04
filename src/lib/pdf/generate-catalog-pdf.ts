// =====================================================================
// Gerador de PDF - Catalogo B2B personalizado
// Stack: jsPDF + jspdf-autotable (funciona 100% no browser)
// - Capa com logo + data
// - Sumario por tipo
// - Cards por vinho (imagem, nome, produtor, preco, ficha)
// - Performance: converte imagem remota -> dataURL uma unica vez
// =====================================================================
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SelectedWine } from '@/types/wine';

export interface PdfBranding {
  companyName?: string;
  logoDataUrl?: string;     // opcional: PNG/JPG ja em base64
  primaryColor?: string;    // hex, ex: '#7A1F2B'
  phone?: string;
  email?: string;
  site?: string;
}

export interface PdfOptions extends PdfBranding {
  title?: string;
  subtitle?: string;
  footerMessage?: string;
}

const DEFAULT_BRANDING: Required<Omit<PdfBranding, 'logoDataUrl' | 'phone' | 'email' | 'site'>> = {
  companyName: 'Vinheria Premium',
  primaryColor: '#7A1F2B',
};

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return [122, 31, 43];
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

export async function generateCatalogPdf(
  wines: SelectedWine[],
  options: PdfOptions = {},
): Promise<Blob> {
  const branding = { ...DEFAULT_BRANDING, ...options };
  const [r, g, b] = hexToRgb(branding.primaryColor);

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  // ---------- CAPA ----------
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageW, 60, 'F');

  if (branding.logoDataUrl) {
    try {
      doc.addImage(branding.logoDataUrl, 'PNG', margin, 14, 24, 24);
    } catch { /* logo opcional */ }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(branding.companyName, margin + (branding.logoDataUrl ? 30 : 0), 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(options.title ?? 'Catalogo de Vinhos - Atacado B2B', margin + (branding.logoDataUrl ? 30 : 0), 34);
  doc.text(
    new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    margin + (branding.logoDataUrl ? 30 : 0),
    41,
  );

  // Bloco de contato (canto superior direito)
  doc.setFontSize(9);
  let contactY = 20;
  if (branding.phone) { doc.text(branding.phone, pageW - margin, contactY, { align: 'right' }); contactY += 4; }
  if (branding.email) { doc.text(branding.email, pageW - margin, contactY, { align: 'right' }); contactY += 4; }
  if (branding.site)  { doc.text(branding.site,  pageW - margin, contactY, { align: 'right' }); }

  // Resumo
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Resumo da Selecao', margin, 75);

  const total = wines.reduce((acc, w) => acc + w.preco_atacado, 0);
  autoTable(doc, {
    startY: 80,
    head: [['#', 'Vinho', 'Produtor', 'Pais', 'Tipo', 'Safra', 'Preco (caixa)']],
    body: wines.map((w, i) => [
      String(i + 1),
      w.nome,
      w.produtor,
      w.pais,
      w.tipo,
      w.safra ? String(w.safra) : '-',
      BRL(w.preco_atacado),
    ]),
    headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 245, 240] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      6: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // Total destacado
  const endY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setFillColor(r, g, b);
  doc.rect(margin, endY + 4, contentW, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Total: ${BRL(total)}  (${wines.length} ${wines.length === 1 ? 'item' : 'itens'})`,
    pageW / 2,
    endY + 10.5,
    { align: 'center' },
  );

  // ---------- PAGINAS DE PRODUTOS ----------
  for (let i = 0; i < wines.length; i++) {
    const w = wines[i];
    doc.addPage();
    drawWinePage(doc, w, i + 1, wines.length, { r, g, b }, margin, contentW, pageH);
  }

  // ---------- RODAPE em todas as paginas ----------
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const footer = options.footerMessage ?? 'Catalogo sujeito a disponibilidade de estoque. Precos validos para venda no atacado.';
    doc.text(footer, margin, pageH - 7);
    doc.text(`Pagina ${p} de ${pageCount}`, pageW - margin, pageH - 7, { align: 'right' });
  }

  return doc.output('blob');
}

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

  // Faixa de titulo
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${idx.toString().padStart(2, '0')} / ${total}`, margin, 11);

  // Imagem (placeholder se nao carregar)
  const imgX = margin;
  const imgY = 28;
  const imgW = 60;
  const imgH = 90;

  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(248, 245, 240);
  doc.rect(imgX, imgY, imgW, imgH, 'FD');

  // carrega a imagem de forma assincrona via getImage (ja convertida)
  // O jsPDF exige dataURL sincrono - entao essa funcao eh async-safe pois ja
  // recebe a imagem convertida de fora ou ignora o erro.
  // Para evitar travar a renderizacao principal, pintamos placeholder e tentamos inserir depois.

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
  const meta = [
    w.pais,
    w.regiao ?? null,
    w.uva_varietal ?? null,
    w.safra ? `Safra ${w.safra}` : null,
    w.tipo,
  ].filter(Boolean).join('  -  ');
  doc.text(meta, textX, cursorY);
  cursorY += 8;

  // Preco em destaque
  doc.setFillColor(248, 245, 240);
  doc.roundedRect(textX, cursorY, contentW - imgW - 8, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('PRECO ATACADO', textX + 4, cursorY + 6);
  doc.setFontSize(16);
  doc.setTextColor(r, g, b);
  doc.text(BRL(w.preco_atacado), textX + 4, cursorY + 16);

  // Ficha tecnica detalhada
  let fichaY = imgY + imgH + 10;
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Ficha Tecnica', margin, fichaY);
  fichaY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const desc = w.ficha_tecnica_detalhada ?? 'Descricao comercial indisponivel. Consulte nosso vendedor.';
  const lines = splitLines(doc, desc, contentW);
  doc.text(lines, margin, fichaY);
}

// =====================================================================
// Versao com imagem incorporada (await nas URLs -> PDF final)
// =====================================================================
export async function generateCatalogPdfWithImages(
  wines: SelectedWine[],
  options: PdfOptions = {},
): Promise<Blob> {
  // 1) Pre-converte todas as imagens em paralelo (cache incluido)
  const dataUrls = await Promise.all(
    wines.map((w) => (w.imagem_url ? urlToDataUrl(w.imagem_url) : Promise.resolve(null))),
  );

  // 2) Gera o PDF base
  const blob = await generateCatalogPdf(wines, options);

  // 3) Re-insere as imagens nas paginas de produto (pagina 2..N+1)
  //    Estrategia: regenera o PDF para garantir ordem deterministica.
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const [r, g, b] = hexToRgb(options.primaryColor ?? '#7A1F2B');

  // --- CAPA (igual ao generateCatalogPdf) ---
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageW, 60, 'F');
  if (options.logoDataUrl) {
    try { doc.addImage(options.logoDataUrl, 'PNG', margin, 14, 24, 24); } catch { /* */ }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(options.companyName ?? 'Vinheria', margin + (options.logoDataUrl ? 30 : 0), 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(
    options.title ?? 'Catalogo de Vinhos - Atacado B2B',
    margin + (options.logoDataUrl ? 30 : 0),
    34,
  );
  doc.text(
    new Date().toLocaleDateString('pt-BR'),
    margin + (options.logoDataUrl ? 30 : 0),
    41,
  );

  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.text('Resumo da Selecao', margin, 75);

  const total = wines.reduce((acc, x) => acc + x.preco_atacado, 0);
  autoTable(doc, {
    startY: 80,
    head: [['#', 'Vinho', 'Produtor', 'Pais', 'Tipo', 'Safra', 'Preco (caixa)']],
    body: wines.map((w, i) => [
      String(i + 1), w.nome, w.produtor, w.pais, w.tipo, w.safra ? String(w.safra) : '-', BRL(w.preco_atacado),
    ]),
    headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 245, 240] },
    columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 6: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });

  const endY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setFillColor(r, g, b);
  doc.rect(margin, endY + 4, contentW, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(`Total: ${BRL(total)} (${wines.length} ${wines.length === 1 ? 'item' : 'itens'})`, pageW / 2, endY + 10.5, { align: 'center' });

  // --- PAGINAS DE PRODUTO (com imagem real) ---
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
    doc.text(`${String(i + 1).padStart(2, '0')} / ${wines.length}`, margin, 11);

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

    // Texto
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
    const meta = [w.pais, w.regiao ?? null, w.uva_varietal ?? null, w.safra ? `Safra ${w.safra}` : null, w.tipo]
      .filter(Boolean).join('  -  ');
    doc.text(meta, textX, cursorY);
    cursorY += 8;

    // Preco
    doc.setFillColor(248, 245, 240);
    doc.roundedRect(textX, cursorY, contentW - imgW - 8, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('PRECO ATACADO', textX + 4, cursorY + 6);
    doc.setFontSize(16);
    doc.setTextColor(r, g, b);
    doc.text(BRL(w.preco_atacado), textX + 4, cursorY + 16);

    // Ficha
    let fichaY = imgY + imgH + 10;
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Ficha Tecnica', margin, fichaY);
    fichaY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const desc = w.ficha_tecnica_detalhada ?? 'Descricao comercial indisponivel. Consulte nosso vendedor.';
    const lines = splitLines(doc, desc, contentW);
    doc.text(lines, margin, fichaY);
  }

  // Rodape
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const footer = options.footerMessage ?? 'Catalogo sujeito a disponibilidade de estoque. Precos validos para venda no atacado.';
    doc.text(footer, margin, pageH - 7);
    doc.text(`Pagina ${p} de ${pageCount}`, pageW - margin, pageH - 7, { align: 'right' });
  }

  void blob; // silencia "unused"
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
