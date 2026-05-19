-- Profile finance mode: personal | self_employed | both

create type public.finance_mode as enum (
  'personal',
  'self_employed',
  'both'
);

alter table public.profiles
  add column finance_mode public.finance_mode not null default 'personal';

-- Map legacy flag for existing rows
update public.profiles
set finance_mode = 'self_employed'
where is_self_employed = true;

comment on column public.profiles.finance_mode is
  'Controls dashboard layout and optional tax/business features.';
