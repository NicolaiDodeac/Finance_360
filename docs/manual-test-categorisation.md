# Manual test checklist — Business categorisation

Use this after importing a Lloyds (or similar) bank statement PDF and before filing-related flows. Run against a **test account** with known sample data.

## Setup

- [ ] Sign in with a test user that has default categories and tax years seeded
- [ ] Import **Lloyds PDF** via `/transactions/import` and confirm transactions appear uncategorised

## Categorisation assistant (`/transactions/categorise`)

- [ ] Banner on `/transactions` shows uncategorised count and links to the assistant
- [ ] **How categorisation works** panel is visible with four explainer sections
- [ ] Merchant groups appear (grouped by normalised description/merchant)
- [ ] Progress shows **N groups left** and decreases after each apply

### Three-step flow (each merchant card)

- [ ] **Step 1** — Choose Personal, Business, or Not sure
- [ ] **Step 2** — Only relevant category options shown (no HMRC dropdown)
- [ ] **Step 3** — Review panel shows financial category, tax category (business expense), business flag, evidence hint; confirm before apply

### Income

- [ ] Personal income group → **Salary** → `is_business` false, no HMRC
- [ ] Business income group → **Business income / turnover** → `is_business` true, no HMRC
- [ ] Confirm salary does **not** appear in business turnover; self-employed income **does** on dashboard/tax views

### Expenses

- [ ] Personal → e.g. **Groceries** → `is_business` false, no HMRC required
- [ ] Business → e.g. **Software / digital tools** → `is_business` true, HMRC auto-mapped; tax category hidden until “Change”
- [ ] **Mixed personal and business** → business use % on review step → `business_use_percent` saved

### Not sure & skip

- [ ] **Not sure** → no category forced; group leaves queue; transactions flagged for review (visible in Transactions)
- [ ] **Skip for now** → group hidden for session; “Show skipped groups” brings them back

### Remember merchant rule

- [ ] **Remember this choice** toggle ON (default for clear merchants) / OFF for ambiguous (Amazon, PayPal, Tesco, transfers)
- [ ] Advanced: **Change rule behaviour** → future similar vs group-only
- [ ] Rule appears under `/settings/rules` (match: contains, both fields)
- [ ] **Re-import** the same statement (or add matching rows) → matching merchants auto-categorise per rule
- [ ] Re-import does **not** auto-mark as business unless the saved rule says so

## Downstream updates

After categorising a representative mix of income and expenses:

- [ ] **Dashboard** — business vs personal totals and uncategorised count update
- [ ] **Tax hub** (`/tax`) — business expense/income summaries reflect new categories
- [ ] **Self Assessment prep** (`/tax/self-assessment`) — expense groups and turnover align with categorisation choices

## Regression

- [ ] `npm run build` passes
- [ ] No references to removed dropdown assistant UI (`merchant-group-card`, bulk confident apply)
