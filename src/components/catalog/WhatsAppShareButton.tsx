'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { shareWineOnWhatsApp } from '@/lib/share/whatsapp';

interface Props {
  wineName: string;
  productUrl: string;
  imageUrl?: string;
}

export function WhatsAppShareButton({ wineName, productUrl, imageUrl }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const result = await shareWineOnWhatsApp({ wineName, productUrl, imageUrl });
    if (result === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 active:scale-95"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Link copiado!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Compartilhar no WhatsApp
        </>
      )}
    </button>
  );
}
