'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface ShareButtonProps {
  wineName: string;
  productUrl: string;
  className?: string;
}

export function ShareButton({ wineName, productUrl, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    // Check if native sharing is supported by the browser/OS
    if (navigator.share) {
      try {
        setSharing(true);
        await navigator.share({
          title: `Allvino - ${wineName}`,
          text: `Confira este vinho no catálogo Allvino B2B: ${wineName}`,
          url: productUrl,
        });
      } catch (err) {
        // User cancelled or other error, fallback to clipboard copy if it wasn't a User Abort
        if (err instanceof DOMException && err.name !== 'AbortError') {
          copyToClipboard();
        }
      } finally {
        setSharing(false);
      }
    } else {
      // Fallback: Copy link to clipboard
      copyToClipboard();
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleShare}
        disabled={sharing}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#A61C3C] hover:bg-[#8B1A2B] text-white px-6 py-3.5 text-sm font-semibold tracking-wide shadow-lg transition duration-200 active:scale-[0.98] disabled:opacity-70 ${className || ''}`}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 stroke-[2.5]" />
            Link Copiado!
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Compartilhar Vinho
          </>
        )}
      </button>
      
      {/* Subtle hint for desktop users */}
      {!copied && (
        <span className="text-[11px] text-stone-400 text-center block sm:hidden md:block">
          No computador, o link será copiado para colar.
        </span>
      )}
    </div>
  );
}
