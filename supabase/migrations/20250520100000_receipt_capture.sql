-- Smart Receipt Capture: OCR payload, payment method, source

alter table public.receipts
  add column if not exists ocr_data jsonb,
  add column if not exists payment_method text check (
    payment_method is null
    or payment_method in ('cash', 'card', 'contactless', 'unknown')
  ),
  add column if not exists source text not null default 'manual' check (
    source in ('manual', 'receipt_capture')
  );

create index if not exists receipts_source_idx on public.receipts (source);
