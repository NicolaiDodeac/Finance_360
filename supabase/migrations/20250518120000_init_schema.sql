-- Finance 360: core schema (tables, indexes, triggers)

-- ---------------------------------------------------------------------------
-- Extensions & helpers
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.account_type as enum (
  'current',
  'savings',
  'credit_card',
  'cash',
  'business',
  'other'
);

create type public.transaction_direction as enum (
  'income',
  'expense',
  'transfer'
);

create type public.rule_match_field as enum (
  'description',
  'merchant_name',
  'both'
);

create type public.rule_match_type as enum (
  'contains',
  'equals',
  'starts_with',
  'regex'
);

-- ---------------------------------------------------------------------------
-- HMRC reference categories (system-wide, read-only for users)
-- ---------------------------------------------------------------------------

create table public.hmrc_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  sa_box text,
  is_allowable_expense boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- User-owned tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text,
  default_currency text not null default 'GBP',
  timezone text not null default 'Europe/London',
  is_self_employed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_id_matches_user_id check (id = user_id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  account_type public.account_type not null default 'current',
  institution_name text,
  currency text not null default 'GBP',
  last_four_digits text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  hmrc_category_id uuid references public.hmrc_categories (id) on delete set null,
  parent_id uuid references public.categories (id) on delete set null,
  icon text,
  color text,
  is_allowable_expense boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, slug)
);

create table public.tax_years (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, label),
  constraint tax_years_valid_range check (end_date > start_date)
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  original_filename text,
  mime_type text,
  file_size_bytes bigint,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  currency text not null default 'GBP',
  target_date date,
  account_id uuid references public.accounts (id) on delete set null,
  is_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  transaction_date date not null,
  description text,
  merchant_name text,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'GBP',
  direction public.transaction_direction not null,
  category_id uuid references public.categories (id) on delete set null,
  hmrc_category_id uuid references public.hmrc_categories (id) on delete set null,
  is_business boolean not null default false,
  business_use_percent numeric(5, 2) check (
    business_use_percent is null
    or (business_use_percent >= 0 and business_use_percent <= 100)
  ),
  tax_year_id uuid references public.tax_years (id) on delete set null,
  receipt_id uuid references public.receipts (id) on delete set null,
  raw_import_data jsonb,
  notes text,
  ai_confidence numeric(4, 3) check (
    ai_confidence is null
    or (ai_confidence >= 0 and ai_confidence <= 1)
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.categorization_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  priority integer not null default 0,
  is_active boolean not null default true,
  match_field public.rule_match_field not null default 'description',
  match_type public.rule_match_type not null default 'contains',
  match_value text not null,
  category_id uuid references public.categories (id) on delete set null,
  hmrc_category_id uuid references public.hmrc_categories (id) on delete set null,
  is_business boolean,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tax_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tax_year_id uuid not null references public.tax_years (id) on delete cascade,
  gross_income numeric(14, 2) not null default 0,
  allowable_expenses numeric(14, 2) not null default 0,
  estimated_tax_due numeric(14, 2),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, tax_year_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index profiles_user_id_idx on public.profiles (user_id);

create index accounts_user_id_idx on public.accounts (user_id);

create index categories_user_id_idx on public.categories (user_id);
create index categories_hmrc_category_id_idx on public.categories (hmrc_category_id);

create index tax_years_user_id_idx on public.tax_years (user_id);

create index receipts_user_id_idx on public.receipts (user_id);

create index savings_goals_user_id_idx on public.savings_goals (user_id);

create index transactions_user_id_transaction_date_idx
  on public.transactions (user_id, transaction_date desc);
create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_hmrc_category_id_idx on public.transactions (hmrc_category_id);
create index transactions_tax_year_id_idx on public.transactions (tax_year_id);

create index categorization_rules_user_id_priority_idx
  on public.categorization_rules (user_id, priority desc);

create index tax_estimates_user_id_idx on public.tax_estimates (user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger tax_years_set_updated_at
  before update on public.tax_years
  for each row execute function public.set_updated_at();

create trigger receipts_set_updated_at
  before update on public.receipts
  for each row execute function public.set_updated_at();

create trigger savings_goals_set_updated_at
  before update on public.savings_goals
  for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create trigger categorization_rules_set_updated_at
  before update on public.categorization_rules
  for each row execute function public.set_updated_at();

create trigger tax_estimates_set_updated_at
  before update on public.tax_estimates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, display_name)
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
