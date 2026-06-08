import type { Metadata, Viewport } from 'next';
import { Inter, Cinzel } from 'next/font/google';
import { GlobalHeader } from '@/components/ui/GlobalHeader';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-cinzel',
});

export const metadata: Metadata = {
  title: 'Allvino - Catalogo de Vinhos B2B',
  description: 'Catalogo digital interativo de vinhos para o mercado atacadista',
  applicationName: 'Allvino',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Allvino' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#8B1A2B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cinzel.variable}`}>
      <body className="min-h-screen bg-stone-900 text-stone-100">
        <GlobalHeader />
        {children}
      </body>
    </html>
  );
}
