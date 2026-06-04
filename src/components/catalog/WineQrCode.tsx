'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface WineQrCodeProps {
  url: string;
  className?: string;
}

export function WineQrCode({ url, className }: WineQrCodeProps) {
  const [qrSvg, setQrSvg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function generateQr() {
      try {
        setLoading(true);
        // Generates SVG string
        const svg = await QRCode.toString(url, {
          type: 'svg',
          margin: 1,
          width: 180,
          color: {
            dark: '#0B090A', // Contrast rich dark tone for scanning reliability
            light: '#FFFFFF',
          },
        });
        if (active) {
          setQrSvg(svg);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to generate QR Code', err);
        if (active) {
          setError('Erro ao carregar QR Code');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    generateQr();

    return () => {
      active = false;
    };
  }, [url]);

  return (
    <div className={`mt-8 overflow-hidden rounded-2xl border border-stone-850 bg-[#0B090A] p-6 shadow-xl text-center ${className || ''}`}>
      <div className="flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex h-[180px] w-[180px] animate-pulse items-center justify-center rounded-xl bg-stone-800">
            <div className="h-10 w-10 rounded-full border-2 border-stone-600 border-t-[#A61C3C] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex h-[180px] w-[180px] items-center justify-center rounded-xl bg-stone-900 border border-stone-800 text-stone-400 text-xs px-4">
            {error}
          </div>
        ) : (
          <div 
            className="overflow-hidden rounded-xl bg-white p-2 shadow-inner"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        )}
        
        <div className="mt-4">
          <p className="text-xs font-semibold tracking-wider text-[#A61C3C] uppercase">
            Acesso Rápido
          </p>
          <p className="mt-1 text-sm font-medium text-stone-300">
            Aponte a câmera para abrir no celular
          </p>
        </div>
      </div>
    </div>
  );
}
