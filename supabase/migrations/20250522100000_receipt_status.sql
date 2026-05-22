-- Receipt lifecycle states for capture / review / vault

alter table public.receipts
  add column if not exists status text not null default 'ready' check (
    status in ('processing', 'needs_review', 'ready', 'linked', 'archived')
  );

create index if not exists receipts_status_idx on public.receipts (status);

comment on column public.receipts.status is
  'processing: OCR in progress; needs_review: incomplete OCR; ready: awaiting link; linked: attached to transaction; archived: hidden from active lists';
