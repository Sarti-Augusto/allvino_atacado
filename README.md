# Catalogo Digital Interativo de Vinhos - B2B

> Mobile-first PWA para atacadistas de vinhos atenderem restaurantes, bares, supermercados e emporios.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Supabase** (Postgres + Auth + Storage com Image Transform)
- **Tailwind CSS** + `lucide-react`
- **Zustand** (com persist em localStorage)
- **jsPDF + jspdf-autotable** (geracao de PDF 100% client-side)
- **Web Share API + wa.me fallback** (compartilhamento WhatsApp)

## Estrutura de Pastas

```
wine-catalog/
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Schema completo (tabelas, RLS, triggers, storage)
│   └── seed.sql                     # Dados de exemplo (apenas dev)
│
├── public/                          # Assets estaticos + PWA icons
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout (PWA, fontes, theme)
│   │   ├── page.tsx                 # Home / Catalogo
│   │   ├── globals.css
│   │   ├── vinho/[id]/page.tsx      # Pagina do produto (ficha + share)
│   │   └── admin/
│   │       ├── login/page.tsx
│   │       ├── page.tsx             # Dashboard
│   │       └── vinhos/
│   │           ├── page.tsx         # Listagem
│   │           ├── novo/page.tsx    # Criar
│   │           └── [id]/page.tsx    # Editar
│   │
│   ├── components/
│   │   ├── catalog/
│   │   │   ├── WineCard.tsx            # Card com checkbox de selecao
│   │   │   ├── FilterBar.tsx           # Filtros avancados
│   │   │   ├── FloatingPdfButton.tsx   # Botao flutuante "Gerar PDF"
│   │   │   └── WhatsAppShareButton.tsx # Compartilhar
│   │   ├── admin/
│   │   │   └── WineForm.tsx            # CRUD form
│   │   └── ui/                         # Componentes base (shadcn)
│   │
│   ├── lib/
│   │   ├── supabase.ts                 # Cliente Supabase (browser + server)
│   │   ├── pdf/
│   │   │   └── generate-catalog-pdf.ts # GERADOR DE PDF (DELIVERABLE #3)
│   │   └── share/
│   │       └── whatsapp.ts             # COMPARTILHAMENTO WHATSAPP (DELIVERABLE #4)
│   │
│   ├── store/
│   │   └── selection-store.ts          # Zustand - carrinho de selecao
│   │
│   ├── hooks/
│   │   └── useFilteredWines.ts         # Filtro client-side memoizado
│   │
│   └── types/
│       └── wine.ts                     # Tipos do dominio
│
├── next.config.mjs                     # Otimizacao de imagens + headers
├── tailwind.config.ts
├── package.json
└── README.md
```

## Setup (10 passos)

```bash
# 1. Instalar
npm install

# 2. Criar projeto Supabase (https://supabase.com)

# 3. No SQL Editor do Supabase, rodar:
#    supabase/migrations/001_initial_schema.sql
#    (e opcionalmente supabase/seed.sql em dev)

# 4. Configurar variaveis de ambiente
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 5. Criar primeiro admin (via Supabase Auth > Add user)
#    A trigger ja cria o profile em admin_users automaticamente.

# 6. Rodar
npm run dev

# 7. (Opcional) PWA - adicionar @ducanh2912/next-pwa
#    e configurar manifest.json em /public

# 8. Deploy
#    Recomendado: Vercel + Supabase
#    - Build: npm run build
#    - Vercel cuida do next/image
#    - Configure as env vars no painel da Vercel
```

## Decisoes de Arquitetura

### Por que Supabase?
- **RLS nativo** (essencial em B2B) - o cliente so ve vinhos `ativo = true`, admin ve tudo
- **Storage com Image Transform** - `?width=600&quality=80` resolve performance automaticamente
- **Auth** ja integrado, sem codar backend de login
- **Postgres** - RLS policies no banco = seguranca inquebravel mesmo se o front for burlado

### Por que Next.js App Router?
- **SEO por vinho** - cada `/vinho/[id]` pode ser SSG/SSR para indexacao no Google
- **Server Components** - lista do catalogo renderiza no servidor (TTFB baixo)
- **API Routes / Server Actions** - se precisar adicionar endpoints custom (ex: webhook WhatsApp)

### Por que gerar PDF no client (jsPDF)?
- **Zero custo de servidor** - cada cliente B2B gera o proprio PDF
- **Privacidade** - a selecao nunca sai do browser
- **Offline-friendly** - depois do primeiro load, funciona sem internet (PWA)

### Performance das imagens
1. `next/image` faz lazy load + geracao automatica de `srcset`
2. Supabase Storage faz resize on-the-fly (`?width=600`)
3. Skeleton + blur enquanto carrega
4. Formato AVIF/WebP automatico

## Proximos Passos (sugestoes)

- [ ] Autenticacao admin (Server Action que chama `supabase.auth.signInWithPassword`)
- [ ] PWA manifest + service worker (offline-first)
- [ ] Lazy load de imagens com `loading="lazy"` (ja feito pelo next/image)
- [ ] Pre-fetch do PDF no hover do botao (cache de imagem)
- [ ] Compartilhar via QR Code na pagina do produto
- [ ] Historico de catalogos gerados por cliente (autenticado)
- [ ] Integracao com WhatsApp Business API para envio direto
