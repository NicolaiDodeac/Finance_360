-- Planning Hub v1: optional metadata for savings goals (1:1)

create type public.savings_goal_type as enum (
  'house_deposit',
  'trip',
  'emergency_fund',
  'big_purchase',
  'debt_payoff'
);

create table public.savings_goal_details (
  goal_id uuid primary key references public.savings_goals (id) on delete cascade,
  goal_type public.savings_goal_type not null,
  notes text,
  estimated_total_cost numeric(14, 2) check (
    estimated_total_cost is null or estimated_total_cost > 0
  ),
  deposit_percent numeric(5, 2) check (
    deposit_percent is null
    or (deposit_percent > 0 and deposit_percent <= 100)
  ),
  destination text,
  people_count smallint check (
    people_count is null or people_count > 0
  ),
  priority smallint not null default 0 check (priority >= 0 and priority <= 10),
  monthly_contribution_target numeric(14, 2) check (
    monthly_contribution_target is null or monthly_contribution_target >= 0
  ),
  monthly_essential_expenses numeric(14, 2) check (
    monthly_essential_expenses is null or monthly_essential_expenses > 0
  ),
  target_months_cover numeric(5, 2) check (
    target_months_cover is null or target_months_cover > 0
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index savings_goal_details_goal_type_idx
  on public.savings_goal_details (goal_type);

create trigger savings_goal_details_set_updated_at
  before update on public.savings_goal_details
  for each row execute function public.set_updated_at();

create or replace function public.savings_goal_space_id(p_goal_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select space_id from public.savings_goals where id = p_goal_id limit 1;
$$;

alter table public.savings_goal_details enable row level security;

create policy "savings_goal_details_select_space"
  on public.savings_goal_details for select to authenticated
  using (public.is_active_space_member(public.savings_goal_space_id(goal_id)));

create policy "savings_goal_details_insert_space"
  on public.savings_goal_details for insert to authenticated
  with check (
    public.is_active_space_member(public.savings_goal_space_id(goal_id))
    and public.can_manage_space(public.savings_goal_space_id(goal_id))
    and exists (
      select 1
      from public.savings_goals g
      where g.id = goal_id
        and g.user_id = auth.uid()
    )
  );

create policy "savings_goal_details_update_space"
  on public.savings_goal_details for update to authenticated
  using (
    public.is_active_space_member(public.savings_goal_space_id(goal_id))
    and public.can_manage_space(public.savings_goal_space_id(goal_id))
  )
  with check (
    public.is_active_space_member(public.savings_goal_space_id(goal_id))
    and public.can_manage_space(public.savings_goal_space_id(goal_id))
  );

create policy "savings_goal_details_delete_space"
  on public.savings_goal_details for delete to authenticated
  using (
    public.is_active_space_member(public.savings_goal_space_id(goal_id))
    and public.can_manage_space(public.savings_goal_space_id(goal_id))
  );

grant select, insert, update, delete on table public.savings_goal_details to authenticated;
