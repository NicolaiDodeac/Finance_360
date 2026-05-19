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

3. In Supabase Dashboard → Authentication → URL Configuration, set:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

4. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
    └── categorization/ # Future AI/rules categorization
```

## Routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Financial overview |
| `/transactions` | Transaction list |
| `/goals` | Savings goals |
| `/tax` | Tax Hub |
| `/receipts` | Receipt storage |
| `/insights` | Analytics & AI insights |
| `/settings` | Account settings |

Protected routes require authentication via middleware.
