-- =====================================================================
-- Wine Catalog B2B - Storage Bucket para PDF Catalogs
-- =====================================================================

-- 1. Cria o bucket 'pdf-catalogs' se não existir (público para leitura)
insert into storage.buckets (id, name, public)
values ('pdf-catalogs', 'pdf-catalogs', true)
on conflict (id) do nothing;

-- 2. Políticas de acesso para os objetos no bucket 'pdf-catalogs'

-- Leitura pública para que qualquer cliente com o link consiga visualizar o PDF
drop policy if exists "pdf_catalogs_public_read" on storage.objects;
create policy "pdf_catalogs_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'pdf-catalogs');

-- Upload permitido para representantes ativos
drop policy if exists "pdf_catalogs_admin_insert" on storage.objects;
create policy "pdf_catalogs_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pdf-catalogs'
    and exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.ativo = true
    )
  );

-- Deleção permitida para representantes ativos
drop policy if exists "pdf_catalogs_admin_delete" on storage.objects;
create policy "pdf_catalogs_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pdf-catalogs'
    and exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.ativo = true
    )
  );

-- 3. Adicionar coluna pdf_url no histórico de orçamentos se não existir
alter table public.catalog_history add column if not exists pdf_url text;

