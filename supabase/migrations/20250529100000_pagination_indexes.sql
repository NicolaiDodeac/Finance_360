-- Pagination / list-filter performance indexes (see docs/pagination-audit.md)
-- Additive only: no schema or behaviour changes.

-- ---------------------------------------------------------------------------
-- Transactions: composite indexes for filtered, date-ordered list queries
-- ---------------------------------------------------------------------------

-- Base list sort (may already exist from init migration; IF NOT EXISTS is safe)
create index if not exists transactions_user_id_transaction_date_idx
  on public.transactions (user_id, transaction_date desc);

create index if not exists transactions_user_id_direction_transaction_date_idx
  on public.transactions (user_id, direction, transaction_date desc);

create index if not exists transactions_user_id_category_id_transaction_date_idx
  on public.transactions (user_id, category_id, transaction_date desc);

create index if not exists transactions_user_id_hmrc_category_id_transaction_date_idx
  on public.transactions (user_id, hmrc_category_id, transaction_date desc);

-- Optional trigram indexes for ilike search on description / merchant
do $$
begin
  create extension if not exists pg_trgm with schema extensions;

  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    execute $idx$
      create index if not exists transactions_description_trgm_idx
        on public.transactions using gin (description extensions.gin_trgm_ops)
    $idx$;

    execute $idx$
      create index if not exists transactions_merchant_name_trgm_idx
        on public.transactions using gin (merchant_name extensions.gin_trgm_ops)
    $idx$;
  end if;
exception
  when others then
    raise notice 'Skipping transaction trigram indexes: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- Receipts: composite indexes for vault pagination and priority sections
-- ---------------------------------------------------------------------------

create index if not exists receipts_user_id_created_at_idx
  on public.receipts (user_id, created_at desc);

create index if not exists receipts_user_id_status_created_at_idx
  on public.receipts (user_id, status, created_at desc);

create index if not exists receipts_user_id_tax_year_id_created_at_idx
  on public.receipts (user_id, tax_year_id, created_at desc);
