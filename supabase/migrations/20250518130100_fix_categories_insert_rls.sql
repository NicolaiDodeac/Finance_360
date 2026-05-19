-- Fix category child inserts: self-referential RLS subquery on INSERT blocked parent lookup.
-- Validate parent ownership via trigger instead.

drop policy if exists "categories_insert_own" on public.categories;

create policy "categories_insert_own"
  on public.categories
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create or replace function public.validate_category_parent()
returns trigger
language plpgsql
as $$
begin
  if new.parent_id is not null then
    if not exists (
      select 1
      from public.categories parent
      where parent.id = new.parent_id
        and parent.user_id = new.user_id
    ) then
      raise exception 'Parent category must belong to the same user';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists categories_validate_parent on public.categories;

create trigger categories_validate_parent
  before insert or update of parent_id, user_id
  on public.categories
  for each row
  execute function public.validate_category_parent();

-- Same self-referential subquery issue on UPDATE.
drop policy if exists "categories_update_own" on public.categories;

create policy "categories_update_own"
  on public.categories
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
