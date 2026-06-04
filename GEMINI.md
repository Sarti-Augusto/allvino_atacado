# GEMINI.md

<!-- GSD:project-start source:PROJECT.md -->
## Project

O Allvino Catalog B2B é um aplicativo web (PWA) de catálogo interativo de vinhos premium voltado para o mercado de atacado (B2B). Ele permite que atacadistas de vinhos atendam restaurantes, bares, supermercados e empórios com agilidade, gerando catálogos PDF customizados client-side e facilitando o compartilhamento de seleções de produtos via WhatsApp e QR Code.

### Core Value
Proporcionar aos clientes B2B um catálogo de vinhos rápido, interativo e gerador de vendas, permitindo a seleção ágil de produtos e a exportação direta para orçamentos e compartilhamentos personalizados.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + `lucide-react`
- **Database & Auth & Storage**: Supabase (Postgres + Auth + Storage)
- **State Management**: Zustand (com persistência em localStorage para o carrinho de seleção)
- **PDF Generation**: jsPDF + jspdf-autotable (100% client-side)
- **Social Sharing**: Web Share API + WhatsApp (wa.me fallback)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- **Server Actions**: Utilizar Server Actions para comunicação com o banco de dados (ex: busca e manipulação de vinhos) localizados na pasta `src/app/actions/`.
- **Client Components**: Declarar `"use client"` apenas nos componentes interativos de catálogo, filtros ou formulários, mantendo as páginas estruturais como Server Components por padrão.
- **Segurança (RLS)**: Respeitar e manter as políticas de segurança Row Level Security (RLS) do Supabase. Operações de CRUD só devem ser permitidas a usuários com perfil administrativo ativo.
- **Variáveis de Ambiente**: Nunca colocar chaves ou segredos em código. Utilizar variáveis de ambiente configuradas em `.env.local`.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

O projeto está estruturado em torno do Next.js App Router:
- `/src/app/`: Contém as rotas da aplicação (como `/` para o Catálogo e futuramente `/admin`).
- `/src/components/`: Componentes modulares de UI organizados por contexto (`admin/`, `catalog/`, `ui/`).
- `/src/lib/`: Código de infraestrutura e serviços (Supabase client, gerador de PDF, integrador WhatsApp).
- `/src/store/`: Zustand selection-store para gerenciar vinhos marcados pelo usuário.
- `/supabase/`: Migrações SQL locais de estrutura de tabelas, triggers e RLS.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` — do not edit manually.
<!-- GSD:profile-end -->
