// =====================================================================
// Compartilhamento via WhatsApp
// Estrategia:
// 1) Tenta a Web Share API nativa (mobile Android/iOS) - abre o sheet do SO
// 2) Se nao disponivel OU o usuario cancela, cai pro fallback wa.me
// 3) Em desktop, abre o WhatsApp Web direto
// =====================================================================

export interface ShareWinePayload {
  wineName: string;
  productUrl: string;     // URL canonica do vinho (canonical URL)
  customMessage?: string; // opcional: mensagem custom do cliente
  phone?: string;         // opcional: numero destino (com DDI, ex: 5511999999999)
  imageUrl?: string;      // opcional: url da imagem do vinho
}

const DEFAULT_MESSAGE = (name: string, url: string) =>
  `Ola! Veja esse rotulo do nosso catalogo: ${name} - ${url}`;

/**
 * Compartilha um vinho via WhatsApp.
 * Retorna o metodo usado: 'native-share' | 'wa-link' | 'clipboard'.
 */
export async function shareWineOnWhatsApp(
  payload: ShareWinePayload,
): Promise<'native-share' | 'wa-link' | 'clipboard'> {
  const message = payload.customMessage ?? DEFAULT_MESSAGE(payload.wineName, payload.productUrl);
  const text = encodeURIComponent(message);
  const url = encodeURIComponent(payload.productUrl);

  // ---------- 1) Web Share API (mobile) ----------
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      // canShare eh mais confiavel que share para checar suporte
      const data: ShareData = {
        title: payload.wineName,
        text: message,
        url: payload.productUrl,
      };
      // Adiciona files se for suportado (iOS 13+ / Android Chrome)
      if (payload.imageUrl && 'canShare' in navigator) {
        try {
          const res = await fetch(payload.imageUrl, { mode: 'cors' });
          if (res.ok) {
            const blob = await res.blob();
            const file = new File([blob], 'vinho.jpg', { type: blob.type });
            if ((navigator as Navigator).canShare?.({ files: [file] })) {
              data.files = [file];
            }
          }
        } catch { /* sem previews - tudo bem */ }
      }
      await navigator.share(data);
      return 'native-share';
    } catch (err) {
      // Usuario cancelou -> nao fazer nada
      if ((err as DOMException).name === 'AbortError') return 'native-share';
      // Outro erro: cai no fallback
    }
  }

  // ---------- 2) Fallback: wa.me (funciona em qualquer device) ----------
  const waHref = payload.phone
    ? `https://wa.me/${sanitizePhone(payload.phone)}?text=${text}`
    : `https://wa.me/?text=${text}`;

  // Em mobile, prefere _self (abre o app); em desktop, nova aba
  const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const opened = window.open(waHref, isMobile ? '_self' : '_blank', 'noopener,noreferrer');

  if (opened) return 'wa-link';

  // ---------- 3) Ultimo recurso: copia pro clipboard ----------
  try {
    await navigator.clipboard.writeText(message);
    return 'clipboard';
  } catch {
    // Em ultimo caso, redireciona a aba atual
    window.location.href = waHref;
    return 'wa-link';
  }
}

// =====================================================================
// Versao "build link" - util para abrir direto via <a href> (sem JS)
// =====================================================================
export function buildWhatsAppLink(payload: ShareWinePayload): string {
  const message = payload.customMessage ?? DEFAULT_MESSAGE(payload.wineName, payload.productUrl);
  const text = encodeURIComponent(message);
  return payload.phone
    ? `https://wa.me/${sanitizePhone(payload.phone)}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
