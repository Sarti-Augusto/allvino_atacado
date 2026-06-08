-- =====================================================================
-- Wine Catalog B2B - Schema Inicial
-- Target: Supabase (PostgreSQL 15+)
-- Idempotente: pode rodar quantas vezes quiser
-- =====================================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- busca textual rápida

-- =====================================================================
-- ENUMS
-- =====================================================================
do $$ begin
  create type wine_type as enum ('Tinto', 'Branco', 'Rose', 'Espumante', 'Fortificado', 'Licoroso');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- TABELA: wines
-- =====================================================================
create table if not exists public.wines (
  id                     uuid primary key default uuid_generate_v4(),
  nome                   text not null,
  produtor               text not null,
  pais                   text not null default 'Brasil',
  regiao                 text,
  uva_varietal           text,
  tipo                   wine_type not null default 'Tinto',
  safra                  integer,
  graduacao_alcoolica    numeric(4,2),  -- ex: 13.50
  preco_atacado          numeric(10,2) not null check (preco_atacado >= 0),
  caixa_fechada_qnt      integer not null default 6 check (caixa_fechada_qnt > 0),
  imagem_url             text,
  ficha_tecnica_detalhada text,
  ativo                  boolean not null default true,
  destaque               boolean not null default false,  -- bônus: "destaques da semana"
  ordem                  integer not null default 0,      -- ordenação manual
  criado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now(),

  -- Sanity checks
  constraint safra_range check (safra is null or (safra between 1900 and extract(year from now())::int + 1)),
  constraint graduacao_range check (graduacao_alcoolica is null or (graduacao_alcoolica between 0 and 100))
);

-- Índices
create index if not exists idx_wines_ativo     on public.wines (ativo) where ativo = true;
create index if not exists idx_wines_tipo      on public.wines (tipo);
create index if not exists idx_wines_pais      on public.wines (pais);
create index if not exists idx_wines_preco     on public.wines (preco_atacado);
create index if not exists idx_wines_destaque  on public.wines (destaque) where destaque = true;
-- Índice GIN para busca textual (nome, produtor, uva)
create index if not exists idx_wines_search
  on public.wines using gin (
    (nome || ' ' || produtor || ' ' || coalesce(uva_varietal, '') || ' ' || coalesce(regiao, ''))
    gin_trgm_ops
  );

-- =====================================================================
-- TABELA: admin_users (perfil de admin, separada do auth.users)
-- =====================================================================
create table if not exists public.admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  nome        text not null,
  role        text not null default 'editor' check (role in ('owner', 'editor')),
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- =====================================================================
-- TRIGGERS
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_wines_updated_at on public.wines;
create trigger trg_wines_updated_at
  before update on public.wines
  for each row execute function public.set_updated_at();

-- Trigger: ao criar usuário no auth.users, criar profile admin
create or replace function public.handle_new_admin_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_users (id, email, nome)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin_user();

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================
alter table public.wines       enable row level security;
alter table public.admin_users enable row level security;

-- WINES
-- Leitura pública apenas de vinhos ativos
drop policy if exists "wines_public_read" on public.wines;
create policy "wines_public_read"
  on public.wines for select
  to anon, authenticated
  using (ativo = true);

-- Admin pode TUDO
drop policy if exists "wines_admin_all" on public.wines;
create policy "wines_admin_all"
  on public.wines for all
  to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.ativo = true
    )
  )
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.ativo = true
    )
  );

-- ADMIN_USERS
drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read"
  on public.admin_users for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "admin_users_owner_all" on public.admin_users;
create policy "admin_users_owner_all"
  on public.admin_users for all
  to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.role = 'owner' and au.ativo = true
    )
  );

-- =====================================================================
-- STORAGE BUCKET: wine-images
-- =====================================================================
-- Cria o bucket (público para leitura, upload só admin)
insert into storage.buckets (id, name, public)
values ('wine-images', 'wine-images', true)
on conflict (id) do nothing;

-- Policies de Storage
drop policy if exists "wine_images_public_read" on storage.objects;
create policy "wine_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'wine-images');

drop policy if exists "wine_images_admin_write" on storage.objects;
create policy "wine_images_admin_write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'wine-images'
    and exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.ativo = true
    )
  );

drop policy if exists "wine_images_admin_delete" on storage.objects;
create policy "wine_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'wine-images'
    and exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.ativo = true
    )
  );

-- =====================================================================
-- VIEWS ÚTEIS (opcional)
-- =====================================================================
create or replace view public.wines_active_summary as
  select
    id, nome, produtor, pais, tipo, uva_varietal, safra,
    preco_atacado, imagem_url, destaque
  from public.wines
  where ativo = true
  order by destaque desc, ordem asc, nome asc;

-- =====================================================================
-- FIM
-- =====================================================================
