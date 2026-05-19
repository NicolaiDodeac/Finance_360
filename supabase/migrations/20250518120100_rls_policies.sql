-- Finance 360: Row Level Security policies

-- ---------------------------------------------------------------------------
-- HMRC categories (read-only reference data)
-- ---------------------------------------------------------------------------

alter table public.hmrc_categories enable row level security;

create policy "hmrc_categories_select_authenticated"
  on public.hmrc_categories
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- User-owned tables
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.tax_years enable row level security;
alter table public.receipts enable row level security;
alter table public.savings_goals enable row level security;
alter table public.transactions enable row level security;
alter table public.categorization_rules enable row level security;
alter table public.tax_estimates enable row level security;

-- profiles
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_delete_own"
  on public.profiles for delete to authenticated
  using (auth.uid() = user_id);

-- accounts
create policy "accounts_select_own"
  on public.accounts for select to authenticated
  using (auth.uid() = user_id);

create policy "accounts_insert_own"
  on public.accounts for insert to authenticated
  with check (auth.uid() = user_id);

create policy "accounts_update_own"
  on public.accounts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "accounts_delete_own"
  on public.accounts for delete to authenticated
  using (auth.uid() = user_id);

-- categories
create policy "categories_select_own"
  on public.categories for select to authenticated
  using (auth.uid() = user_id);

create policy "categories_insert_own"
  on public.categories for insert to authenticated
  with check (
    auth.uid() = user_id
    and (
      parent_id is null
      or exists (
        select 1 from public.categories parent
        where parent.id = parent_id and parent.user_id = auth.uid()
      )
    )
  );

create policy "categories_update_own"
  on public.categories for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      parent_id is null
      or exists (
        select 1 from public.categories parent
        where parent.id = parent_id and parent.user_id = auth.uid()
      )
    )
  );

create policy "categories_delete_own"
  on public.categories for delete to authenticated
  using (auth.uid() = user_id);

-- tax_years
create policy "tax_years_select_own"
  on public.tax_years for select to authenticated
  using (auth.uid() = user_id);

create policy "tax_years_insert_own"
  on public.tax_years for insert to authenticated
  with check (auth.uid() = user_id);

create policy "tax_years_update_own"
  on public.tax_years for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tax_years_delete_own"
  on public.tax_years for delete to authenticated
  using (auth.uid() = user_id);

-- receipts
create policy "receipts_select_own"
  on public.receipts for select to authenticated
  using (auth.uid() = user_id);

create policy "receipts_insert_own"
  on public.receipts for insert to authenticated
  with check (auth.uid() = user_id);

create policy "receipts_update_own"
  on public.receipts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "receipts_delete_own"
  on public.receipts for delete to authenticated
  using (auth.uid() = user_id);

-- savings_goals
create policy "savings_goals_select_own"
  on public.savings_goals for select to authenticated
  using (auth.uid() = user_id);

create policy "savings_goals_insert_own"
  on public.savings_goals for insert to authenticated
  with check (
    auth.uid() = user_id
    and (
      account_id is null
      or exists (
        select 1 from public.accounts a
        where a.id = account_id and a.user_id = auth.uid()
      )
    )
  );

create policy "savings_goals_update_own"
  on public.savings_goals for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      account_id is null
      or exists (
        select 1 from public.accounts a
        where a.id = account_id and a.user_id = auth.uid()
      )
    )
  );

create policy "savings_goals_delete_own"
  on public.savings_goals for delete to authenticated
  using (auth.uid() = user_id);

-- transactions
create policy "transactions_select_own"
  on public.transactions for select to authenticated
  using (auth.uid() = user_id);

create policy "transactions_insert_own"
  on public.transactions for insert to authenticated
  with check (
    auth.uid() = user_id
    and (
      account_id is null
      or exists (
        select 1 from public.accounts a
        where a.id = account_id and a.user_id = auth.uid()
      )
    )
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = auth.uid()
      )
    )
    and (
      tax_year_id is null
      or exists (
        select 1 from public.tax_years ty
        where ty.id = tax_year_id and ty.user_id = auth.uid()
      )
    )
    and (
      receipt_id is null
      or exists (
        select 1 from public.receipts r
        where r.id = receipt_id and r.user_id = auth.uid()
      )
    )
  );

create policy "transactions_update_own"
  on public.transactions for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      account_id is null
      or exists (
        select 1 from public.accounts a
        where a.id = account_id and a.user_id = auth.uid()
      )
    )
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = auth.uid()
      )
    )
    and (
      tax_year_id is null
      or exists (
        select 1 from public.tax_years ty
        where ty.id = tax_year_id and ty.user_id = auth.uid()
      )
    )
    and (
      receipt_id is null
      or exists (
        select 1 from public.receipts r
        where r.id = receipt_id and r.user_id = auth.uid()
      )
    )
  );

create policy "transactions_delete_own"
  on public.transactions for delete to authenticated
  using (auth.uid() = user_id);

-- categorization_rules
create policy "categorization_rules_select_own"
  on public.categorization_rules for select to authenticated
  using (auth.uid() = user_id);

create policy "categorization_rules_insert_own"
  on public.categorization_rules for insert to authenticated
  with check (
    auth.uid() = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = auth.uid()
      )
    )
  );

create policy "categorization_rules_update_own"
  on public.categorization_rules for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = auth.uid()
      )
    )
  );

create policy "categorization_rules_delete_own"
  on public.categorization_rules for delete to authenticated
  using (auth.uid() = user_id);

-- tax_estimates
create policy "tax_estimates_select_own"
  on public.tax_estimates for select to authenticated
  using (auth.uid() = user_id);

create policy "tax_estimates_insert_own"
  on public.tax_estimates for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.tax_years ty
      where ty.id = tax_year_id and ty.user_id = auth.uid()
    )
  );

create policy "tax_estimates_update_own"
  on public.tax_estimates for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.tax_years ty
      where ty.id = tax_year_id and ty.user_id = auth.uid()
    )
  );

create policy "tax_estimates_delete_own"
  on public.tax_estimates for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grants (RLS enforces row ownership; grants allow role access to tables)
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;

grant select on table public.hmrc_categories to authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.accounts to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;
grant select, insert, update, delete on table public.tax_years to authenticated;
grant select, insert, update, delete on table public.receipts to authenticated;
grant select, insert, update, delete on table public.savings_goals to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;
grant select, insert, update, delete on table public.categorization_rules to authenticated;
grant select, insert, update, delete on table public.tax_estimates to authenticated;
