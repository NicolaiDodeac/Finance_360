# Receipt OCR Regression Investigation

Symptom: receipt review gets stuck indefinitely on **"Reading your receipt…"**.

## 1. Current pipeline (as mapped)

```
Capture button (CaptureProvider → useReceiptCapture)
  → file selected / camera photo
  → captureReceipt() server action
      → upload original bytes to Supabase Storage (receipts bucket)
      → insert receipts row with status = "processing", empty OCR fields
      → return { id }
  → client router.push(/receipts/review/{id})
  → review page (server component) → getReceiptCaptureReview(id)
      → derives receiptStatus from row.status + extraction
  → ReceiptCaptureReviewGate (client)
      → if status === "processing": render spinner AND
        run runReceiptCaptureOcr(id) in a useEffect
            → retryReceiptOcr(id)
                → download original from storage
                → extractReceiptFromBuffer()
                    → prepareImageBufferForOcr (HEIC→JPEG, orient)
                    → preprocessImageForOcr (sharp: grayscale/contrast/sharpen)
                    → tesseract.js worker.recognize()  ← OCR
                    → parseReceiptText()
                → deriveReceiptStatus() → update receipts row (+ status)
      → on success: router.refresh() → re-fetch → spinner clears
  → review page shows review / needs-review / linked
```

Files:
`src/components/capture/capture-provider.tsx`,
`src/components/receipts/use-receipt-capture.tsx`,
`src/components/receipts/receipt-capture-review-gate.tsx`,
`src/app/(app)/receipts/review/[id]/page.tsx`,
`src/lib/receipts/capture-actions.ts`,
`src/lib/receipts/ocr/*`,
`src/lib/receipts/status.ts`.

DB: `supabase/migrations/20250522100000_receipt_status.sql` adds **only** a
`status` column (`processing | needs_review | ready | linked | archived`).
There is **no** `ocr_status` column — so any code/intent referencing a separate
`ocr_status` DB field would be a mismatch. We track OCR sub-state inside the
`ocr_data` JSON (`ocr_status`, `ocr_error`) to avoid a risky schema change.

## 2. What makes the spinner show, and why it never clears

The gate renders the spinner whenever:

```ts
needsScan = review.receipt.status === "processing" || review.receiptStatus === "processing";
```

`needsScan` is derived from the **server-provided (stale) prop**. OCR is run on
the client in a `useEffect`. The spinner only clears when `router.refresh()`
re-fetches the row and sees a non-processing status.

### Root cause

The gate left the receipt pinned on `status = "processing"` whenever OCR did
**not** finish on the happy path:

1. **Failure path didn't refresh.** When `runReceiptCaptureOcr` returned
   `{ success: false }` (e.g. an unreadable photo where Tesseract produced no
   text), the gate set `scanError` but did **not** call `router.refresh()`. The
   render checks `needsScan` *before* `scanError`, and `needsScan` was still
   `true` from the stale prop → **infinite spinner** even though the DB row had
   moved to `needs_review`.
2. **No timeout / watchdog.** If `worker.recognize()` (Tesseract) was slow or
   hung — e.g. first-run language-data download, a very large image, or the
   platform's `maxDuration` killing the request — the server action never
   resolved, `isPending` stayed `true`, and `needsScan` stayed `true` forever.
3. **Thrown errors had the same fate** as (1): caught into `scanError`, no
   refresh, spinner kept winning the render.

### Why it worked before / what changed

At commit `4a5bab2` ("photo flow works"), `captureReceipt` ran OCR **inline
during upload** (`extractReceiptFromBuffer` before the row insert), so the row
was inserted with final fields and a terminal status (`ready`/`needs_review`) —
**never `processing`**. The review page just displayed results; there was no
client-triggered OCR and no spinner to get stuck on.

The "new flow and receipt handling" / "simplified UI" refactor moved OCR to a
**lazy, client-triggered** step (`status = "processing"` on upload, OCR run from
the review gate's `useEffect`). That introduced the stuck-state surface, and the
gate's error/timeout handling was not robust, so any non-happy OCR outcome left
the receipt pinned on `processing`.

## 3–5. Fixes applied

- **Guaranteed escape (`retryReceiptOcr`)**: wrapped in `try/catch/finally`. Any
  failure, throw, or timeout now updates `status = needs_review`,
  `ocr_data.ocr_status = "failed"`, stores `ocr_data.ocr_error`, and keeps the
  uploaded file. The receipt can never stay in `processing` after the action
  runs. Success sets `ocr_status = "processed"`.
- **OCR timeout** (`extractReceiptFromBuffer` / `extractImageText`): Tesseract
  `recognize()` races a timeout; on timeout the worker is terminated and a
  friendly error is returned instead of hanging.
- **Structured logging**: `[receipt] <stage>` / `[receipt:error] <stage>` with
  receipt id, mime, size, status, ocr_status and elapsed ms per stage.
- **Robust review gate**:
  - Runs OCR once, then **always** `router.refresh()` (success *or* failure) so
    the page reflects the terminal DB status.
  - **30s watchdog**: if still processing, it calls `markReceiptNeedsReview`
    (escape hatch) and refreshes, so the user is never trapped on the spinner.
  - Render order shows the manual fallback instead of the spinner once the
    timeout fires. Copy: "Still reading this receipt…" → "We couldn't finish
    reading this receipt. You can still review it manually." with Retry scan /
    Review manually / Continue later. Delete + manual edit live on the
    needs-review panel.
- **Status consistency**: `status` remains the lifecycle source of truth;
  `ocr_status` (`pending | processed | failed | skipped`) is recorded in
  `ocr_data`. Review logic:
  - `status=processing` → reading state (bounded by the watchdog)
  - `status=ready` → review
  - `status=needs_review` (or `ocr_status` failed/skipped) → manual path
  - `status=linked` → linked details

## 7. Tests

`npm run check:receipt-ocr` now includes Rontec fuel (£100.42 / £30.00, cash,
VAT) and B&Q (£64.80, cash) fixtures, asserts parsed merchant/total/date/
payment/VAT and classification, and asserts that **every** fixture resolves to a
terminal `reviewLevel` (never an undefined/processing-like state) and that
`deriveReceiptStatus` never returns `processing` for a completed parse.
