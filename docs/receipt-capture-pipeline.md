# Receipt Capture Pipeline

This document describes the end-to-end picture-receipt capture pipeline: how a
photo becomes a confirmed transaction. It is the reference for the "Receipt
Capture Reliability + Speed Sprint" work.

Ideal daily flow:

```
Take photo
  → receipt image saved as proof (original, never altered)
  → OCR extracts merchant / date / amount / payment method
  → app suggests category + purpose (+ HMRC if business)
  → app finds a matching transaction OR suggests creating one
  → user confirms
  → done
```

## Stages

### 1. Upload (`captureReceipt`)

File: `src/lib/receipts/capture-actions.ts` → `captureReceipt(formData)`

- Validates the file (`isAllowedReceiptFile`, `MAX_RECEIPT_FILE_BYTES`).
- Uploads the **original, unmodified** bytes to the `receipts` storage bucket at
  a path built by `buildReceiptStoragePath`.
- Inserts a `receipts` row with `status: "processing"` and empty OCR fields.
- The stored original is the legal/audit evidence and is **never** overwritten
  by preprocessing or OCR.

Constants: `src/lib/receipts/constants.ts` (bucket, allowed MIME/extensions, max
size, signed-URL expiry).

### 2. OCR / text extraction (`extractReceiptFromBuffer`)

File: `src/lib/receipts/ocr/extract.ts`

- Triggered lazily on the review screen via `runReceiptCaptureOcr` /
  `retryReceiptOcr` (see `ReceiptCaptureReviewGate`).
- Downloads the stored original into an in-memory buffer.
- **PDF**: `extractPdfText` (from the import pipeline).
- **Image**: `prepareImageBufferForOcr` (format normalisation) →
  `preprocessImageForOcr` (OCR-only enhancement) → Tesseract.js (`eng`).
- Only the in-memory buffer is preprocessed; the stored file is untouched.
- Returns `ReceiptOcrExtraction` plus an optional friendly `ocrError`.

Image preparation:

- `src/lib/receipts/ocr/prepare-image.ts` — converts HEIC/HEIF to JPEG and
  fixes EXIF orientation so Tesseract can read the bytes at all.
- `src/lib/receipts/ocr/preprocess-image.ts` — OCR-only enhancement
  (downscale very large images, grayscale, contrast normalisation, sharpen).
  Best-effort: any failure falls back to the prepared buffer so OCR still runs.

### 3. Field extraction (`parseReceiptText`)

File: `src/lib/receipts/ocr/parse-text.ts`

Layered, deterministic extraction from the OCR/PDF text:

- **Merchant** — `extractMerchantFromReceiptText`
  (`src/lib/receipts/ocr/extract-merchant.ts`):
  1. Known-merchant dictionary with fuzzy OCR patterns
     (`known-merchants.ts`).
  2. Best readable "store name" line near the top (noise-rejecting score).
  3. Generic first-plausible-line heuristic.
  4. Unknown.
- **Total** — `extractTotal`: keyword lines first (total / amount due / balance
  due / card / paid / sale / purchase), rejecting VAT-only, change and cashback
  amounts, then the largest plausible amount, biased below any subtotal.
- **Date** — `extractDate`: date+time lines, common UK/ISO formats, with
  day/month disambiguation.
- **VAT** — `extractVat`: `VAT` / `V.A.T` labelled amounts. Never blocks
  confirmation.
- **Payment method** — `extractPaymentMethod`: contactless / cash / card
  (visa, mastercard, amex, debit, credit, chip & pin).

Money parsing: `src/lib/receipts/ocr/parse-amount.ts` handles `16.40`, `16,40`,
`£16.40`, `1,234.56`.

### 4. Confidence model (`scoreReceiptConfidence`)

File: `src/lib/receipts/ocr/confidence.ts`

Computes per-field confidence (`merchant`, `date`, `total`, `payment`, `vat`)
and an overall review level:

- `high` — merchant + total + date all found and trustworthy.
- `medium` — total + date found, merchant/category uncertain.
- `needs_review` — missing total, or no usable merchant/date.

The extraction also keeps the legacy coarse `confidence` (`high|medium|low`) for
backward compatibility. `fieldConfidence` and `reviewLevel` are persisted inside
`ocr_data` and rebuilt on the review screen.

### 5. Persistence

`extractionToOcrData` (in `extract.ts`) flattens the extraction into the
`receipts.ocr_data` JSON column plus the typed columns (`merchant_name`,
`receipt_date`, `total_amount`, `vat_amount`, `payment_method`).
`deriveReceiptStatus` (`status.ts`) maps the result to a `ReceiptStatus`
(`processing | needs_review | ready | linked | archived`).

### 6. Classification / suggestion

Files: `src/lib/receipts/classify.ts`, `src/lib/receipts/suggest.ts`

- `classifyReceiptText` matches merchant + raw text against deterministic
  keyword groups (groceries, eating out, fuel/travel, beauty supplies, software,
  advertising, training, office/equipment, health, bills) and maps each to an
  existing categorise-flow `CategoryChoiceId`, with personal and business
  variants.
- `buildReceiptCreationSuggestion` turns the classification + finance mode +
  payment method into a `ReceiptCreationSuggestion`: purpose default, category,
  HMRC label (business only), payment label, summary title, and the transaction
  "kind" (cash vs card manual).
- HMRC is only surfaced when the purpose is business.

### 7. Matching (`rankTransactionMatches`)

File: `src/lib/receipts/match.ts`

Conservative scoring — a wrong match is worse than no match:

- **Amount** is the strongest signal; near-exact required for strong/medium.
- **Date** tiers: same day → strong, ≤3 days → medium, ≤7 → weak.
- **Merchant** tiers include an explicit `contradictory` that blocks
  strong/medium.
- `resolveMatchConfidence` only returns `strong`/`medium` when amount, date and
  merchant all agree; weak matches surface separately as "Closest transaction".
- `paymentSortBoost` nudges ranking toward cash vs card accounts.

`assertConservativeReceiptMatching` guards these invariants in
`scripts/run-receipt-match-assertions.ts`.

### 8. Review + create/link

Page: `src/app/(app)/receipts/review/[id]/page.tsx`
Gate: `src/components/receipts/receipt-capture-review-gate.tsx` (runs OCR, shows
"Reading your receipt…").
View: `src/components/receipts/receipt-capture-review-view.tsx`.

Review adapts to confidence (fast review modes):

- **High** — compact card (merchant, amount, date, suggested purpose/category,
  match-or-create) with a single Confirm.
- **Medium** — same compact card, highlighting only the uncertain field.
- **Needs review** — `ReceiptNeedsReviewPanel` asks only for the missing fields
  (amount / date / merchant / payment), never the full accounting form.

Actions:

- Link to a suggested/closest transaction (`attachReceiptToTransaction`).
- Create + link a new transaction (`createTransactionFromReceipt`), choosing a
  cash vs manual-card account from the detected/declared payment method.
- Cash/card decision: if payment is detected, use it; otherwise ask
  "How did you pay? Cash / Card / Other".

### 9. Cleanup / recovery

Every receipt in `needs_review`/failed/skipped can:

- **Retry scan** — `retryReceiptOcr`.
- **Edit manually** — `updateReceiptMetadata`.
- **Delete** — `deleteReceipt` (`ReceiptDeleteButton`).
- **Continue later** — link back to `/receipts`.

No upload gets permanently stuck: a failed scan is stored as `needs_review`
with the friendly error in `ocr_data.scan_error`.

## Tests / scripts

- `npm run check:receipt-ocr` — `scripts/run-receipt-ocr-assertions.ts`
  (uses fixtures in `src/lib/receipts/ocr/__fixtures__/receipt-fixtures.ts`).
- `npm run check:receipt-match` — `scripts/run-receipt-match-assertions.ts`.
- `npm run check:hmrc` — `scripts/run-hmrc-assertions.ts`.

## Extension points

- **Better OCR service**: replace the Tesseract call in `extractImageText`
  (`extract.ts`). The preprocessing and parsing layers are independent, so a new
  OCR backend only needs to return text into `parseReceiptText`.
- **Merchant memory**: `parseReceiptText` accepts an optional merchant-memory
  hook so previous transactions can confirm a merchant when amount/date match.
