-- Budgeting v1: monthly plans by category, space-scoped (personal or household)

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  year smallint not null check (year between 2000 and 2100),
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index budgets_space_period_idx
  on public.budgets (space_id, year, month);

create index budgets_user_id_idx on public.budgets (user_id);
create index budgets_space_id_idx on public.budgets (space_id);

create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  warning_threshold numeric(5, 4) check (
    warning_threshold is null
    or (warning_threshold > 0 and warning_threshold <= 1)
  ),
  created_at timestamptz not null default timezone('utc', now()),
  unique (budget_id, category_id)
);

create index budget_items_budget_id_idx on public.budget_items (budget_id);
create index budget_items_category_id_idx on public.budget_items (category_id);

create or replace function public.budget_space_id(p_budget_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select space_id from public.budgets where id = p_budget_id limit 1;
$$;

-- budgets RLS
alter table public.budgets enable row level security;

create policy "budgets_select_space"
  on public.budgets for select to authenticated
  using (public.is_active_space_member(space_id));

create policy "budgets_insert_space"
  on public.budgets for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.is_active_space_member(space_id)
    and public.can_manage_space(space_id)
  );

create policy "budgets_update_space"
  on public.budgets for update to authenticated
  using (
    public.is_active_space_member(space_id)
    and public.can_manage_space(space_id)
  )
  with check (
    public.is_active_space_member(space_id)
    and public.can_manage_space(space_id)
  );

create policy "budgets_delete_space"
  on public.budgets for delete to authenticated
  using (
    public.is_active_space_member(space_id)
    and public.can_manage_space(space_id)
  );

-- budget_items RLS
alter table public.budget_items enable row level security;

create policy "budget_items_select_space"
  on public.budget_items for select to authenticated
  using (public.is_active_space_member(public.budget_space_id(budget_id)));

create policy "budget_items_insert_space"
  on public.budget_items for insert to authenticated
  with check (
    public.is_active_space_member(public.budget_space_id(budget_id))
    and public.can_manage_space(public.budget_space_id(budget_id))
    and exists (
      select 1 from public.categories c
      join public.budgets b on b.id = budget_id
      where c.id = category_id and c.user_id = auth.uid()
    )
  );

create policy "budget_items_update_space"
  on public.budget_items for update to authenticated
  using (
    public.is_active_space_member(public.budget_space_id(budget_id))
    and public.can_manage_space(public.budget_space_id(budget_id))
  )
  with check (
    public.is_active_space_member(public.budget_space_id(budget_id))
    and public.can_manage_space(public.budget_space_id(budget_id))
    and exists (
      select 1 from public.categories c
      join public.budgets b on b.id = budget_id
      where c.id = category_id and c.user_id = auth.uid()
    )
  );

create policy "budget_items_delete_space"
  on public.budget_items for delete to authenticated
  using (
    public.is_active_space_member(public.budget_space_id(budget_id))
    and public.can_manage_space(public.budget_space_id(budget_id))
  );

grant select, insert, update, delete on table public.budgets to authenticated;
grant select, insert, update, delete on table public.budget_items to authenticated;
