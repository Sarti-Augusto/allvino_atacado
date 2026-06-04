# Allvino Catalog B2B

**Current Version:** v1.0 (Shipped 2026-06-04)

## What This Is

O Allvino Catalog B2B é um aplicativo web (PWA) de catálogo interativo de vinhos premium voltado para o mercado de atacado (B2B). Ele permite que atacadistas de vinhos atendam restaurantes, bares, supermercados e empórios com agilidade, gerando catálogos PDF customizados client-side e facilitando o compartilhamento de seleções de produtos via WhatsApp e QR Code.

## Core Value

Proporcionar aos clientes B2B um catálogo de vinhos rápido, interativo e gerador de vendas, permitindo a seleção ágil de produtos e a exportação direta para orçamentos e compartilhamentos personalizados.

## Requirements

### Validated

* ✓ Estrutura base de rotas e navegação Next.js 14 App Router.
* ✓ Interface do Catálogo de Vinhos com filtros avançados (país, tipo, uva, produtor, etc.).
* ✓ Estado de seleção de vinhos (Zustand store) para geração de PDF e compartilhamento.
* ✓ Geração client-side básica de PDF usando jsPDF e jspdf-autotable.
* ✓ Supabase Schema Inicial (`001_initial_schema.sql`) contendo tabelas `wines`, `admin_users`, triggers de atualização, políticas RLS e bucket `wine-images`.
* ✓ Cliente Supabase configurado para browser e server components.
* ✓ **Autenticação Administrativa**: Login administrativo seguro utilizando Supabase Auth integrado com Server Actions e proteção de rotas de admin.
* ✓ **Painel Administrativo Completo (CRUD)**: Área restrita para cadastro, edição e exclusão de vinhos, controle de ativação (`ativo`), destaque (`destaque`) e ordenação manual.
* ✓ **Upload de Imagens de Vinhos**: Integração com o bucket `wine-images` do Supabase Storage no formulário de CRUD do admin.
* ✓ **Geração Avançada de PDF**: Customizações no layout do PDF (capas, termos comerciais, dados do representante, ordenação e melhorias visuais).
* ✓ **Compartilhamento por QR Code & Compartilhamento Inteligente**: Gerador de QR Code na tela de detalhes do vinho (`/vinho/[id]`) para facilitar o acesso rápido no mobile, e compartilhamento com Web Share API + fallback clipboard.

### Active

*(Todos os requisitos planejados para a v1.0 foram validados)*

### Out of Scope

* [ ] Checkout financeiro ou gateway de pagamento direto — O foco é a geração de pedidos/catálogos PDF para fechamento offline ou via contato de vendas (WhatsApp).
* [ ] App nativo (Android/iOS) na Google Play/App Store — O foco é a experiência PWA web leve e instalável.

## Context

O projeto já possui a estrutura Next.js 14 (App Router) configurada, integrada com Tailwind CSS e TypeScript. Também conta com o banco de dados PostgreSQL estruturado no Supabase local/remoto e com código client-side funcional para busca, filtragem e geração preliminar de PDF. As funcionalidades administrativas e de segurança são o foco do desenvolvimento imediato para viabilizar a gestão autônoma do catálogo pela Allvino.

## Constraints

* **Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Auth/DB/Storage), Zustand, jsPDF.
* **Segurança**: Uso rigoroso de variáveis de ambiente para credenciais do Supabase; proteção de rotas de admin na camada do Next.js Middleware.
* **Client-side PDF**: Geração de PDF mantida 100% no cliente para economizar recursos de servidor e garantir rapidez offline.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | SEO por vinho e renderização híbrida rápida. | ✓ Concluído |
| jsPDF client-side | Geração de PDFs customizados sem custo de servidor. | ✓ Concluído |
| Supabase Auth + RLS | Segurança baseada no banco de dados e políticas robustas sem backend próprio. | ✓ Concluído |

---
*Last updated: 2026-06-04 after Milestone v1.0 Completion*
