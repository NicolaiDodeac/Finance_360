# Mobile UX Copy Audit

Goal: make Finance 360 read like a simple daily money app, not accounting
software. This pass changed **user-facing wording only** — no features, no
calculations, no navigation rebuild. Technical/accounting language was kept only
in the Tax Hub, Self Assessment, and collapsed "Advanced details" areas.

## Wording changed

| Where (file) | Before | After |
| --- | --- | --- |
| Transactions banner (`transactions-view.tsx`) | "{n} uncategorised transactions" | "{n} transactions need a category" |
| Transactions banner (`transactions-view.tsx`) | "Answer simple questions — we map categories and HMRC behind the scenes." | "Answer a few quick questions — we sort out the categories and tax behind the scenes." |
| Transactions banner CTA (`transactions-view.tsx`) | "Business categorisation" | "Sort these out" |
| Transaction row badge (`transaction-item.tsx`) | "Uncategorized" | "Needs a category" |
| Transaction row badge (`transaction-item.tsx`) | "HMRC needed" | "Tax category" |
| Transaction filters (`transaction-filters.tsx`) | Direction "Expense" | "Spending" |
| Transaction filters (`transaction-filters.tsx`) | Category "Uncategorized" | "Needs a category" |
| Categorisation Assistant header (`categorise/page.tsx`) | "Business categorisation assistant" | "What were these for?" |
| Categorisation Assistant header (`categorise/page.tsx`) | "Income by type, expenses by purpose. Finance 360 maps categories and tax…" | "Answer a few quick questions about your income and spending. Finance 360 sorts out the categories and tax…" |
| Category fields (`transaction-category-fields.tsx`) | "Tax category (HMRC)" ×2 | "Tax category" |
| Category fields (`transaction-category-fields.tsx`) | "Business use (%)" | "How much was for business? (%)" |
| Categorisation review advanced (`transaction-categorisation-review.tsx`) | "Tax category (HMRC)" | "Tax category" |
| Categorisation review advanced (`transaction-categorisation-review.tsx`) | "Business use (%)" | "How much was for business? (%)" |
| Flow review summary (`flow/step-review.tsx`) | "Business use" | "How much for business?" |
| Flow review summary (`flow/step-review.tsx`) | "Tax category (HMRC)" | "Tax category" |
| Business group card (`business-merchant-group-card.tsx`) | "Enter a business use percentage between 1 and 100." | "Enter how much was for business (1–100%)." |
| Dashboard metric hint (`dashboard-view.tsx`) | "Largest personal expense category" | "Largest personal spending category" |
| Dashboard metric hint (`dashboard-view.tsx`) | "Uncategorized or flagged for a quick look" | "Needs a category or a quick look" |
| Rule editor (`rules/rule-form-fields.tsx`) | "HMRC category" | "Tax category" |
| Import complete CTA (`import/import-complete-step.tsx`) | "Categorise imported transactions" | "Sort imported transactions" |

### Already plain (no change needed)
- "Additional proof may help" is already the wording used across the evidence
  system (`lib/evidence/labels.ts`, `lib/tax/calculations.ts`), so the
  "Missing receipt → Additional proof may help" target was already met.
- "What was this for?" is already the primary label in the categorise flow.
- Receipt capture ("Take photo", "Upload photo or PDF") and Quick Add copy are
  already plain English.

## Advanced fields — confirmed collapsed by default
These remain hidden until the user opens "Change details" / "Advanced details",
per `universal-categorisation-review.tsx` (compact + advanced panels):
- Tax category (HMRC), VAT, business-use %, tax year, raw OCR text, receipt
  metadata. No advanced field was promoted to the default review surface.

## Empty states — all offer an action
- Dashboard (`dashboard-empty-state.tsx`): Import / Add transaction / Create goal.
- Transactions (`transactions-empty-state.tsx`): Add transaction / Import.
- Budget (`budget-view.tsx`): create-plan form + savings goals link.
- Planning (`planning-view.tsx`): create-plan panel + goals link.
- Goals: create flow in `GoalsView`.
- Mobile bottom-bar **Capture** tab reinforces Receipt / Voice / Quick Add on every page.

## Mobile navigation — Bottom Tab Bar v1 (shipped)
Mobile/tablet (below `lg`, where the sidebar is hidden) now has a persistent
bottom tab bar (`components/layout/mobile-bottom-nav.tsx`), rendered once in
`AppShell` inside a `CaptureProvider`.

Tabs:
1. **Home** → `/dashboard`
2. **Activity** → `/transactions` (matches nested routes, e.g. import)
3. **Capture** (centre, elevated) → opens the existing global capture bottom
   sheet (Receipt / Voice / Quick Add) via the `useCapture()` context.
4. **Plans** → `/planning`
5. **You** → `/settings` (matches nested settings routes)

Behaviour implemented:
- `lg:hidden` so the **desktop sidebar is unchanged**; full sidebar nav still
  shows all routes on desktop.
- Safe-area padding (`env(safe-area-inset-bottom)`) for the iPhone home bar;
  main content uses `pb-24` on mobile so nothing hides behind the bar.
- Active tab state via `usePathname()` (`aria-current="page"`, primary colour).
- Central Capture button is visually emphasised (raised circle, ring, shadow).
- The old floating FAB was removed; Capture is now the central tab. The capture
  sheet markup moved into `CaptureProvider` so the tab and any future trigger can
  share it (the `global-capture-fab.tsx` file was deleted).

Reachability of routes NOT on the bottom bar (no routes removed):
- **Hamburger menu reduced** to a "More" group that now lists only the secondary
  routes (Budget, Goals, Tax Hub, Receipts, Insights, Settings); Dashboard /
  Transactions / Planning were removed from it because the bottom tabs cover
  them (`mobile-nav.tsx` filters `BOTTOM_TAB_HREFS`).
- **Receipt Vault**: reachable from **You → Tools & more → Receipts** (new card
  on the settings page) and from the More menu.
- **Tax Hub, Self Assessment, Rules**: under **You** (settings) — existing Rules
  card + new "Tools & more" card (Tax Hub, Self Assessment, Insights, Receipts).
- **Budget**: from **Plans** (new quick link in the planning intro) and from the
  **Dashboard** budget card (existing `DashboardBudgetCard`).
- **Goals**: from **Plans** (new quick link + existing plan/goal sections).

Still worth revisiting later:
- **Receipts label**: capture now lives on the Capture tab, so the Receipts
  destination is effectively the vault/history — could be renamed "Receipt vault".
- **Tax Hub + Self Assessment** remain two destinations; fine for self-employed
  users, slightly redundant for personal-only users.

## Risky wording kept intentionally (for tax accuracy)
- **Tax Hub** (`components/tax/*`) and **Self Assessment** (`components/self-assessment/*`)
  keep "HMRC", "allowable expenses", "SA103", "turnover", "tax year". These are
  legal/return terms; changing them could mislead users preparing real figures.
- **Transactions "Tax year" filter** and **Receipt capture "Tax year (optional)"**
  were kept. Hiding them would remove genuine filtering/tagging capability for
  self-employed users. Candidate to move behind an "advanced filters" toggle
  later, but out of scope for a copy-only pass.
- **Transaction row direction text** still renders the raw direction
  ("Expense"/"Income"/"Transfer") in `transaction-item.tsx`. Mapping
  "Expense → Spending" there needs a presentation helper (touches logic), so it
  was deferred and noted here.
- **Settings → Rules** banner still references "HMRC labels" and "uncategorised"
  in explanatory sentences; this is an advanced configuration screen where the
  precise terms aid power users.

## Remaining areas that may need a bigger redesign later
- Mobile navigation: introduce a persistent bottom tab bar (see notes above).
- A single unified "advanced filters" disclosure on Transactions to hide tax
  year / scope behind one tap for personal-only users.
- Consider a per-profile copy switch so personal-only users never see business/
  tax terminology, while self-employed users keep it.
