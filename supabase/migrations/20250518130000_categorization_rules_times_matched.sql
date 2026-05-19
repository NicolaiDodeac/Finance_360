-- Track how often each categorization rule has been applied

alter table public.categorization_rules
  add column if not exists times_matched integer not null default 0;

alter table public.categorization_rules
  drop constraint if exists categorization_rules_times_matched_nonneg;

alter table public.categorization_rules
  add constraint categorization_rules_times_matched_nonneg
  check (times_matched >= 0);
