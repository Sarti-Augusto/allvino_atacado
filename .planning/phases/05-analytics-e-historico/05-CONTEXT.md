# Context — Phase 5: Analytics & Histórico

Este documento detalha o alinhamento técnico e as decisões tomadas para a implementação da infraestrutura de Analytics e Histórico de Catálogos (Fase 1 do Marco v2.0).

---

## Gray Areas Resolved

1. **Escopo da Autenticação (ANLT-01):**
   - **Decisão:** A autenticação se restringe estritamente aos representantes de vendas (usuários existentes na tabela `admin_users`). Clientes finais e compradores B2B acessam o catálogo de forma totalmente aberta e anônima.
   - **Comportamento:** Quando um representante logado gera um PDF, a ferramenta detecta sua sessão Supabase e salva o histórico no banco de dados. Caso um usuário anônimo faça o download, o histórico de orçamentos não é gravado em banco.

2. **Dashboard de Cliques (ANLT-02):**
   - **Decisão:** Será criado um painel de estatísticas integrado na rota existente `/admin` (Dashboard), exibindo métricas agregadas dos vinhos mais populares.
   - **Comportamento:** O dashboard listará um ranking contendo o total de visualizações de páginas de detalhes e o total de downloads de cada vinho em formato PDF.

3. **Arquitetura de Dados:**
   - Criaremos duas tabelas adicionais no Supabase:
     - `wine_analytics`: Armazena eventos atômicos de visualização e download (`tipo_evento` check in ('click', 'download')). Aberta para gravação pública via RLS.
     - `catalog_history`: Armazena o registro de PDFs gerados por representantes logados (Nome do Cliente, WhatsApp do Cliente, Condições Comerciais em JSON, Vinhos Selecionados em JSON). Restrita a usuários administradores.

---

## Technical Specs

### 1. Database Schema (New Migration)

```sql
-- public.wine_analytics
create table if not exists public.wine_analytics (
  id           uuid primary key default uuid_generate_v4(),
  wine_id      uuid references public.wines(id) on delete cascade,
  tipo_evento  text not null check (tipo_evento in ('click', 'download')),
  criado_em    timestamptz not null default now()
);

-- public.catalog_history
create table if not exists public.catalog_history (
  id                  uuid primary key default uuid_generate_v4(),
  representative_id   uuid references public.admin_users(id) on delete set null,
  representative_nome text not null,
  cliente_nome        text not null,
  cliente_whatsapp    text,
  condicoes_comerciais jsonb not null,
  vinhos_selecionados  jsonb not null,
  criado_em           timestamptz not null default now()
);
```

### 2. Event Tracking Hooks

- **Visualização do Vinho:** No client-side da página de detalhes do vinho `/vinho/[id]`, chamaremos uma API/Server Action para registrar o evento `'click'` vinculado ao `wine_id`.
- **Download de PDF:** Ao compilar o PDF no `FloatingPdfButton.tsx`, se houver uma sessão ativa de administrador:
  1. Registramos um evento `'download'` na tabela `wine_analytics` para cada vinho selecionado.
  2. Chamamos a Server Action `saveCatalogHistoryAction` para gravar a exportação na tabela `catalog_history`.

---

## Next Steps

1. Executar o comando `/gsd-plan-phase 5` para detalhar o cronograma de tarefas de desenvolvimento.
