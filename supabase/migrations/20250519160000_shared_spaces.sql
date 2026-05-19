-- Shared Spaces v1: personal + household collaboration on goals

create type public.space_type as enum ('personal', 'household', 'business');

create type public.space_member_role as enum ('owner', 'admin', 'member');

create type public.space_member_status as enum ('active', 'invited');

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.space_type not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.spaces is
  'Finance spaces: personal (private) or shared household/business contexts.';

create unique index spaces_one_personal_per_owner_idx
  on public.spaces (owner_id)
  where type = 'personal';

create index spaces_owner_id_idx on public.spaces (owner_id);

create table public.space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  role public.space_member_role not null default 'member',
  status public.space_member_status not null default 'active',
  invited_email text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint space_members_user_or_invite check (
    status = 'invited' or user_id is not null
  )
);

create index space_members_space_id_idx on public.space_members (space_id);
create index space_members_user_id_idx on public.space_members (user_id);

create unique index space_members_space_user_idx
  on public.space_members (space_id, user_id)
  where user_id is not null;

create unique index space_members_space_invited_email_idx
  on public.space_members (space_id, lower(invited_email))
  where invited_email is not null and status = 'invited';

-- Goals belong to a space (personal or shared)
alter table public.savings_goals
  add column space_id uuid references public.spaces (id) on delete cascade;

create index savings_goals_space_id_idx on public.savings_goals (space_id);

-- RLS helpers
create or replace function public.is_active_space_member(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_members sm
    where sm.space_id = p_space_id
      and sm.user_id = auth.uid()
      and sm.status = 'active'
  );
$$;

create or replace function public.can_manage_space(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_members sm
    where sm.space_id = p_space_id
      and sm.user_id = auth.uid()
      and sm.status = 'active'
      and sm.role in ('owner', 'admin')
  );
$$;

create or replace function public.ensure_personal_space(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_space_id uuid;
begin
  select id into v_space_id
  from public.spaces
  where owner_id = p_user_id and type = 'personal'
  limit 1;

  if v_space_id is not null then
    return v_space_id;
  end if;

  insert into public.spaces (name, type, owner_id)
  values ('Personal', 'personal', p_user_id)
  returning id into v_space_id;

  insert into public.space_members (space_id, user_id, role, status)
  values (v_space_id, p_user_id, 'owner', 'active');

  return v_space_id;
end;
$$;

-- Backfill personal spaces for existing users
do $$
declare
  r record;
  v_space_id uuid;
begin
  for r in select id from public.profiles loop
    v_space_id := public.ensure_personal_space(r.id);
    update public.savings_goals
    set space_id = v_space_id
    where user_id = r.id and space_id is null;
  end loop;
end;
$$;

alter table public.savings_goals
  alter column space_id set not null;

-- New users: personal space on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_space_id uuid;
begin
  insert into public.profiles (id, user_id, display_name)
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );

  v_space_id := public.ensure_personal_space(new.id);

  return new;
end;
$$;

-- spaces RLS
alter table public.spaces enable row level security;

create policy "spaces_select_member"
  on public.spaces for select to authenticated
  using (
    owner_id = auth.uid()
    or public.is_active_space_member(id)
  );

create policy "spaces_insert_household"
  on public.spaces for insert to authenticated
  with check (
    owner_id = auth.uid()
    and type in ('household', 'business')
  );

create policy "spaces_update_manage"
  on public.spaces for update to authenticated
  using (public.can_manage_space(id))
  with check (public.can_manage_space(id));

create policy "spaces_delete_owner"
  on public.spaces for delete to authenticated
  using (owner_id = auth.uid() and type <> 'personal');

-- space_members RLS
alter table public.space_members enable row level security;

create policy "space_members_select"
  on public.space_members for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_active_space_member(space_id)
    or exists (
      select 1 from public.spaces s
      where s.id = space_id and s.owner_id = auth.uid()
    )
  );

create policy "space_members_insert_manage"
  on public.space_members for insert to authenticated
  with check (
    public.can_manage_space(space_id)
    or (
      user_id = auth.uid()
      and role = 'owner'
      and status = 'active'
      and exists (
        select 1 from public.spaces s
        where s.id = space_id and s.owner_id = auth.uid()
      )
    )
  );

create policy "space_members_update_manage"
  on public.space_members for update to authenticated
  using (public.can_manage_space(space_id))
  with check (public.can_manage_space(space_id));

create policy "space_members_delete_manage_or_self"
  on public.space_members for delete to authenticated
  using (
    public.can_manage_space(space_id)
    or user_id = auth.uid()
  );

-- savings_goals: replace user-only policies with space-aware policies
drop policy if exists "savings_goals_select_own" on public.savings_goals;
drop policy if exists "savings_goals_insert_own" on public.savings_goals;
drop policy if exists "savings_goals_update_own" on public.savings_goals;
drop policy if exists "savings_goals_delete_own" on public.savings_goals;

create policy "savings_goals_select_space"
  on public.savings_goals for select to authenticated
  using (public.is_active_space_member(space_id));

create policy "savings_goals_insert_space"
  on public.savings_goals for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.is_active_space_member(space_id)
    and public.can_manage_space(space_id)
    and (
      account_id is null
      or exists (
        select 1 from public.accounts a
        where a.id = account_id and a.user_id = auth.uid()
      )
    )
  );

create policy "savings_goals_update_space"
  on public.savings_goals for update to authenticated
  using (
    public.is_active_space_member(space_id)
    and public.can_manage_space(space_id)
  )
  with check (
    public.is_active_space_member(space_id)
    and public.can_manage_space(space_id)
    and (
      account_id is null
      or exists (
        select 1 from public.accounts a
        where a.id = account_id and a.user_id = auth.uid()
      )
    )
  );

create policy "savings_goals_delete_space"
  on public.savings_goals for delete to authenticated
  using (
    public.is_active_space_member(space_id)
    and public.can_manage_space(space_id)
  );

grant select, insert, update, delete on table public.spaces to authenticated;
grant select, insert, update, delete on table public.space_members to authenticated;
grant execute on function public.ensure_personal_space(uuid) to authenticated;
