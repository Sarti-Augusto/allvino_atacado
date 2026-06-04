-- =====================================================================
-- Wine Catalog B2B - Analytics e Histórico de Orçamentos
-- Target: Supabase (PostgreSQL 15+)
-- =====================================================================

-- =====================================================================
-- TABELA: wine_analytics (rastreamento de cliques e downloads)
-- =====================================================================
create table if not exists public.wine_analytics (
  id           uuid primary key default uuid_generate_v4(),
  wine_id      uuid references public.wines(id) on delete cascade,
  tipo_evento  text not null check (tipo_evento in ('click', 'download')),
  criado_em    timestamptz not null default now()
);

-- Índices para otimização de relatórios
create index if not exists idx_wine_analytics_wine_id on public.wine_analytics (wine_id);
create index if not exists idx_wine_analytics_tipo_evento on public.wine_analytics (tipo_evento);
create index if not exists idx_wine_analytics_criado_em on public.wine_analytics (criado_em desc);

-- RLS
alter table public.wine_analytics enable row level security;

-- Inserção pública (anônimo e autenticado) para rastrear de qualquer local
drop policy if exists "wine_analytics_public_insert" on public.wine_analytics;
create policy "wine_analytics_public_insert"
  on public.wine_analytics for insert
  to anon, authenticated
  with check (true);

-- Leitura restrita a administradores ativos
drop policy if exists "wine_analytics_admin_read" on public.wine_analytics;
create policy "wine_analytics_admin_read"
  on public.wine_analytics for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.ativo = true
    )
  );

-- Exclusão restrita a administradores ativos
drop policy if exists "wine_analytics_admin_delete" on public.wine_analytics;
create policy "wine_analytics_admin_delete"
  on public.wine_analytics for delete
  to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.ativo = true
    )
  );

-- =====================================================================
-- TABELA: catalog_history (histórico de orçamentos gerados por representantes)
-- =====================================================================
create table if not exists public.catalog_history (
  id                  uuid primary key default uuid_generate_v4(),
  representative_id   uuid references public.admin_users(id) on delete set null,
  representative_nome text not null,
  cliente_nome        text not null,
  cliente_whatsapp    text,
  condicoes_comerciais jsonb not null,  -- ex: { frete: 'FOB', prazo: '30 dias', pedido_minimo: 1000.00 }
  vinhos_selecionados  jsonb not null,  -- ex: [ { id: 'uuid', nome: 'Vinho A', preco: 85.00 } ]
  criado_em           timestamptz not null default now()
);

-- Índices
create index if not exists idx_catalog_history_rep on public.catalog_history (representative_id);
create index if not exists idx_catalog_history_criado_em on public.catalog_history (criado_em desc);

-- RLS
alter table public.catalog_history enable row level security;

-- Escrita restrita a administradores ativos
drop policy if exists "catalog_history_admin_insert" on public.catalog_history;
create policy "catalog_history_admin_insert"
  on public.catalog_history for insert
  to authenticated
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.ativo = true
    )
  );

-- Leitura restrita a administradores ativos
drop policy if exists "catalog_history_admin_read" on public.catalog_history;
create policy "catalog_history_admin_read"
  on public.catalog_history for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.ativo = true
    )
  );
