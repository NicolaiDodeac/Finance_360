# Finance 360

UK-focused personal finance and self-employed tax tracking SaaS.

## Stack

- Next.js App Router · TypeScript · Tailwind CSS · shadcn/ui
- Supabase Auth · Postgres · Storage
- Recharts (ready for future charts)

## Getting started

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Add your [Supabase](https://supabase.com) project URL and anon key to `.env.local`.

3. In Supabase Dashboard → **Authentication → URL Configuration**:
   - **Site URL**: your primary app URL (local: `http://localhost:3000`, production: your deployed URL)
   - **Redirect URLs** (add every environment you use):
     - `http://localhost:3000/auth/callback`
     - `https://your-production-domain.com/auth/callback`

   If confirmation emails still open `localhost` while you use a deployed app, the Supabase **Site URL** is probably still set to localhost — update it and add your production callback URL above.

4. Optional: set `NEXT_PUBLIC_APP_URL` in `.env.local` (and in your host’s env vars) to the exact URL users should return to after email confirmation, e.g. `https://your-production-domain.com`. Signup uses this instead of whatever origin the browser had when you registered.

5. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database migrations

SQL migrations live in `supabase/migrations/`. They are **not** applied automatically when you run the app — you must run them against your Supabase Postgres database.

**Supabase Dashboard:** Project → **SQL** → **New query**, paste the contents of each migration file in order (by filename), then **Run**.

If Smart Receipt Capture errors with *Could not find the 'ocr_data' column*, run at least:

`supabase/migrations/20250520100000_receipt_capture.sql`

After running SQL, wait a few seconds (or restart the dev server) so PostgREST refreshes its schema cache.

## Project structure

```
src/
├── app/
│   ├── (app)/          # Protected routes (sidebar layout)
│   ├── (auth)/         # Login & signup
│   └── auth/callback/  # Supabase OAuth callback
├── components/
│   ├── dashboard/
│   ├── transactions/
│   ├── tax/
│   ├── receipts/
│   ├── layout/
│   └── ui/
└── lib/
    ├── supabase/       # Browser, server & middleware clients
    ├── auth/           # requireAuth, getUser helpers
    ├── transactions/   # Future transaction logic
    ├── tax/            # Future UK tax logic
    └── categorization/ # Rules, merchant groups, business assistant
```

## Routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Financial overview |
| `/transactions` | Transaction list |
| `/transactions/categorise` | Business categorisation assistant |
| `/transactions/import` | CSV / PDF import |
| `/goals` | Savings goals |
| `/tax` | Tax Hub |
| `/tax/self-assessment` | Self Assessment prep |
| `/receipts` | Receipt storage |
| `/insights` | Analytics & AI insights |
| `/settings` | Account settings |
| `/settings/rules` | Categorisation rules |

Protected routes require authentication via middleware.

## Manual testing

Before release or after categorisation changes, run the checklist in [docs/manual-test-categorisation.md](docs/manual-test-categorisation.md) (Lloyds PDF import, salary vs self-employed income, personal vs business expenses, mixed %, merchant rules, dashboard/tax/SA updates).
