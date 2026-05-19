-- Receipt Vault: metadata columns, tax year link, storage bucket & policies

-- ---------------------------------------------------------------------------
-- Receipt metadata
-- ---------------------------------------------------------------------------

alter table public.receipts
  add column if not exists merchant_name text,
  add column if not exists receipt_date date,
  add column if not exists total_amount numeric(14, 2) check (
    total_amount is null or total_amount >= 0
  ),
  add column if not exists vat_amount numeric(14, 2) check (
    vat_amount is null or vat_amount >= 0
  ),
  add column if not exists tax_year_id uuid references public.tax_years (id) on delete set null;

create index if not exists receipts_tax_year_id_idx on public.receipts (tax_year_id);
create index if not exists receipts_receipt_date_idx on public.receipts (receipt_date desc);

-- Tighten receipts RLS for tax_year_id ownership
drop policy if exists "receipts_insert_own" on public.receipts;
drop policy if exists "receipts_update_own" on public.receipts;

create policy "receipts_insert_own"
  on public.receipts for insert to authenticated
  with check (
    auth.uid() = user_id
    and (
      tax_year_id is null
      or exists (
        select 1 from public.tax_years ty
        where ty.id = tax_year_id and ty.user_id = auth.uid()
      )
    )
  );

create policy "receipts_update_own"
  on public.receipts for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      tax_year_id is null
      or exists (
        select 1 from public.tax_years ty
        where ty.id = tax_year_id and ty.user_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Storage bucket: receipts
-- Path layout: {user_id}/{tax_year_label|unknown}/{timestamp}-{filename}
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif'
  ]::text[]
)
on conflict (id) do update
set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Users may only access objects under their own user_id folder
create policy "receipts_storage_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipts_storage_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipts_storage_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipts_storage_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
