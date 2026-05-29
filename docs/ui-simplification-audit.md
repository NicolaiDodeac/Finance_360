# UI Simplification + Product Cohesion Audit

Goal: make Finance 360 feel simple, logical, and consistent across mobile and desktop
without adding finance features, changing calculations, removing routes, or breaking flows.

This document is the reference for the simplification sprint. Each page lists its current
issues and the target state. Items marked **[done]** were addressed in this sprint; items
marked **[later]** are larger redesigns deferred to a future sprint.

## Shared infrastructure (already present)

- `src/components/shared/page-header.tsx` — `PageHeader` (title, description, action). Extended in this sprint with `backHref` + `secondaryAction`.
- `src/components/shared/placeholder-card.tsx` — dashed placeholder for "coming soon" content.
- `src/components/shared/empty-state.tsx` — **[done]** new standard empty state (icon, title, description, primary + secondary action).
- `src/components/capture/capture-provider.tsx` — global Capture bottom sheet (Receipt photo / Voice / Quick Add text). Triggered only from the mobile bottom-nav FAB today.
- App content width: single `max-w-6xl` container in `src/components/layout/app-shell.tsx`.

## Global navigation findings

- Mobile bottom nav: Home / Activity / **Capture (FAB)** / Plans / You. Desktop sidebar: Dashboard, Transactions, Budget, Goals, Planning, Tax Hub, Receipts, Insights, Settings.
- Different labels for the same routes on mobile vs desktop (Home=Dashboard, Activity=Transactions, Plans=Planning, You=Settings). Acceptable as app-style shorthand, but documented.
- `/settings` appears twice on mobile (bottom "You" + hamburger "More"). **[done]** `/settings` is now filtered out of the hamburger "More" menu, which shows only secondary tools (Budget, Goals, Tax Hub, Receipts, Insights). Settings is reached via the "You" tab.
- Capture exists only on mobile. Desktop has no global Capture entry. **[later]** consider a desktop Capture affordance.

---

## 1. Dashboard

**Header:** `PageHeader` with Capture receipt + Quick add + month switcher crammed into the action slot (3 controls, wraps on mobile).

Issues:
- Too many header CTAs (Capture receipt, Quick add, month switcher) competing on a crowded top bar.
- `DashboardMonthEmptyState` is a passive dead-end (text only, no CTA). **[done]**
- Wording: "expenses", "Uncategorized transactions", "Uncategorized business expenses", "Assign HMRC categories" in `lib/dashboard/calculations.ts`. **[done copy]**
- Many cross-links (View budget, Create plan, Open Planning Hub, Manage goals, Open Tax Hub, Start prep).

Target:
- Primary = review next action / Capture. Demote month switcher visually; keep one capture affordance.
- Every empty state has one clear next action.

---

## 2. Transactions

**Header:** `PageHeader` (no action slot). Toolbar lives in `TransactionsView` with **three** add paths: Quick add + Import + Add transaction, plus a "Sort these out" banner.

Issues:
- Three competing "add" entry points. Quick add duplicates global Capture. **[done — demote]**
- Inconsistent import label: "Import" (toolbar) vs "Import Center" (page title) vs "Import bank statement" (dashboard). **[done]**
- Empty state is bespoke card, not the shared empty-state. **[done]**
- Copy: core fields "Expense", list `directionLabel()` "Expense", "Mark as a business expense", fallback "Uncategorised". **[done copy]**

Target:
- Primary = Import statement; Secondary = Add manually. Quick add removed from toolbar (covered by global Capture).

---

## 3. Receipt Vault

**Header:** page `PageHeader` ("Receipts").

Issues:
- Multiple competing capture entry points on `/receipts`: `ReceiptCaptureHub` "Take photo" + "Upload photo or PDF", plus `ReceiptUploadForm` "Store receipt" (manual), plus the global Capture FAB → "Receipt" on mobile. **[done — collapse manual form into a disclosure, lean on hub]**
- Empty state ("Nothing stored yet. Upload your first receipt above.") points "above" but the primary CTA is camera, not upload. **[done]**
- Same receipt can appear in "Needs review", "Unmatched", and "All stored proof".
- Jargon: "Unmatched", "Smart Receipt Capture".

Target:
- Primary = Capture receipt (hub). Manual "add details" stays as secondary/disclosure. Empty state with clear next action.

---

## 4. Receipt Review

Issues:
- Many review variants (loading/OCR error, incomplete-scan panel, already-linked success, bank-match, create+categorise). Detection UI duplicated: "We found these details" appears above the universal Detected block; purpose question appears twice in the no-match path. **[later — larger redesign]**
- The single shared primitive is `UniversalCategorisationReview` (Detected → Suggested → Confirm → Change details), used by the create-from-receipt branch and quick-add drafts.

Target:
- Standardise on `UniversalCategorisationReview` language everywhere; remove duplicate detection/purpose blocks (deferred — risky, separate sprint).

---

## 5. Categorise / "What were these for?"

**Header:** `PageHeader` + back link + `CategorisationExplainerPanel`.

Issues:
- Section title "Expenses"; explainer copy "Expenses", "business expenses", "How categorisation works". **[done copy]**
- Long page (explainer 2-col grid before the queue).
- Assistant uses a multi-step card UX distinct from the transaction-drawer review (two mental models). **[later]**

---

## 6. Quick Add

Issues:
- `QuickAddButton` opens its own drawer; also reachable via global Capture (voice + text). Duplicated on dashboard and transactions toolbar. **[done — demote on transactions]**
- `quick-add-draft-card.tsx` direction option labelled "Expense". **[done copy]**

---

## 7. Budget

**Header:** `PageHeader` + month switcher in action slot.

Issues:
- Primary "Create monthly plan" exists only in the empty state; no update UI once a plan exists (returning users have no clear primary). **[later — needs feature work, out of scope: no new features]**
- Empty dashed card lacks the create CTA (offers "View savings goals" instead). **[done]**
- Cross-links (View savings goals, Manage goals, Review transactions) clutter.
- Label drift: nav "Budget" vs copy "monthly plan"; "Actual" vs dashboard "Spent in plan".

Target:
- Primary = Create/update monthly plan. Empty state anchored on Create.

---

## 8. Planning

**Header:** `PageHeader` + a second gradient hero with Monthly budget / Savings goals links (duplicate nav).

Issues:
- Empty `PlaceholderCard` CTA is "View simple goals" instead of "Create plan". **[done]**
- Hero duplicates sidebar nav. **[done — demote]**
- Disabled "Debt payoff" tile looks clickable.
- Label drift: "Planning Hub" vs "Planning" vs "Plans".

Target:
- Primary = Create plan.

---

## 9. Goals

**Header:** `PageHeader` (no action).

Issues:
- Empty `PlaceholderCard` links away ("Open Planning Hub", "Back to dashboard") instead of reinforcing "Add goal". **[done]**
- Always-on placeholder "Goal reminders & linked accounts" adds noise even on populated pages.
- Label drift: card title "Create a savings goal" vs button "Add goal".

Target:
- Primary = Create goal / Add goal.

---

## 10. Tax Hub

**Header:** `PageHeader` always says "self-employed", regardless of finance mode.

Issues:
- `finance_mode` does not affect tax page content (only the nav description). For `personal` users the Tax Hub should be framed as optional. **[done]**
- `TaxHubActions`: primary "Prepare Self Assessment" plus "View related transactions", "Go to receipts", and a disabled "Export — coming soon" (dead CTA). **[done — drop disabled export, demote duplicates]**
- Wording: "Uncategorized" (US) in overview cards + lib. **[done copy]**

Target:
- Primary = Prepare Self Assessment. Optional framing for personal mode.

---

## 11. Self Assessment

Issues:
- De-facto primary is "Copy figures" (outline). No header action / sticky primary.
- Duplicate disclaimer/intro shared with Tax Hub.
- Review titles in lib: "Uncategorized business expenses", "Business expenses without HMRC category", "Higher-value expenses without additional proof". **[done copy]**

Target:
- Primary = Copy figures. (Sticky primary deferred.)

---

## 12. Settings / You

Issues:
- Flat 2-col grid mixing Finance mode, App language, **Setup status (developer)**, Rules, Tools & more (duplicates nav), Profile (last), placeholders.
- `SetupStatusCard` (includes "Run database migrations") is too prominent. **[done — move to Developer / Setup group at the bottom]**
- "Tools & more" duplicates sidebar nav. **[done — grouped into Tax tools + Receipt vault]**

Target groups: Profile → App preferences → Finance mode → Rules & automation → Tax tools → Receipt vault / evidence → Developer / Setup. **[done]**

---

## 13. Rules

Issues:
- Ghost back button above `PageHeader` (ad hoc). **[done — use PageHeader backHref]**
- Empty state copy says "add a rule below" but Add rule is above the list.
- Wording: "Uncategorised"/"Uncategorized" inconsistency, "expense rows", "Business flag".

---

## Copy guide (applied this sprint)

| Old | New | Where |
| --- | --- | --- |
| expense (personal areas) | spending | dashboard, transactions, quick-add, categorise |
| expense (business areas) | business cost | business-facing hints |
| Uncategorized / uncategorised (as a status) | Needs a category | dashboard, tax, SA lib titles |
| HMRC category (outside tax pages) | tax category | non-tax UI (tax pages keep HMRC) |
| missing receipt | additional proof may help | review/tax |
| categorise transactions (as a CTA) | sort these out | banners/CTAs |

---

## Summary of standardisation

- **Page header pattern:** `PageHeader` extended with `backHref` + `secondaryAction`; back links unified (Rules, Import, Categorise, Self Assessment).
- **Empty state pattern:** new `EmptyState` component with primary + secondary actions; applied to dashboard month-empty, transactions, receipts vault, planning, goals, tax.
- **Primary action per page:** documented and enforced; duplicate/demoted CTAs listed in the final report.
- **Capture:** global Capture remains the main entry point; duplicate prominent capture/quick-add buttons demoted.

## Remaining larger UX issues (separate redesign sprint)

1. Receipt review flow consolidation (remove duplicate Detected/purpose blocks, unify the 5+ variants).
2. Assistant vs transaction-drawer review have two different mental models; converge on one.
3. Budget needs an "update plan" flow for returning users (requires feature work, intentionally out of scope here).
4. Mobile: import preview table → cards; long drawers (quick add, receipt detail) need height caps.
5. Tap targets: bump remaining `size="sm"` controls (month chevrons, per-card actions) on primary mobile paths.
