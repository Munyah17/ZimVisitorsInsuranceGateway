# Zim Travelmate (Zimbabwe Visitor Insurance Gateway)

Digital insurance distribution and administration platform for foreign
visitors to Zimbabwe, operated by Zim Travel Mate and underwritten
by a licensed Microinsurance Company. The customer sees one brand, **Zim
Travelmate**; the platform manages the underwriter, product ownership, premium
allocation and claims routing underneath.

> **Prototype** — most screens run on mock data. Paynow Zimbabwe checkout is
> a real, live server-side integration (see below); the SQL file is a
> complete, commented Supabase schema ready to deploy. Not an offer of insurance.

## What's in this repo

| Part | Location | Description |
|---|---|---|
| **A — Frontend prototype** | `app/`, `components/`, `lib/` | Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn-style UI + Framer Motion. Mock data only. |
| **B — Backend prototype** | `supabase/schema.sql` | Complete PostgreSQL schema: 12 tables, enums, FKs, indexes, RLS, seed data — every table commented with frontend + API + insurance meaning. |
| **C — Integration blueprint** | `docs/INTEGRATION_BLUEPRINT.md` | How frontend ⇄ Supabase ⇄ payments ⇄ WhatsApp ⇄ future mobile apps connect. |

## Screens

- `/` — Landing page (hero slider, why-insurance, coverage plans, trust)
- `/quote` — 6-step quote wizard: visitor → travel → coverage → premium → checkout → certificate.
  Checkout does a full redirect to Paynow's hosted page (live); falls back to
  a simulated demo flow if `PAYNOW_*` / `SUPABASE_SERVICE_ROLE_KEY` aren't set.
- `/quote/return` — where Paynow sends the customer back; polls payment
  status and shows the issued certificate(s)
- `/portals` — Login/Signup with demo credentials (client, agent, admin)
- `/portal` — Client portal (active policy, days left, coverage, emergency assistance)
- `/verify` — Public policy verification (try `ZVIG-2026-00001`)
- `/claims` — Claim submission + tracking timeline
- `/agent` — Agent portal (sales, commissions, recent customers)
- `/admin` — Admin command centre (KPIs incl. YTD visitors/claims/commission,
  countries, agents, claims queue)
- `/partners` — Service Partners directory (clinics, ambulances, emergency
  care), searchable and filterable by category
- `/private` — hidden Super Admin console (owner username + PIN): feature
  flags, gateways, pricing, users & roles, API keys, integrations, SMS
  messaging, audit, system health

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Most screens need no backend. For live Paynow checkout, copy
`.env.local.example` to `.env.local` and fill in `PAYNOW_INTEGRATION_ID`,
`PAYNOW_INTEGRATION_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (after running
`supabase/schema.sql` on your project) — without these, checkout falls back
to a simulated flow automatically.

## Deploy

- **Frontend**: Vercel — import this GitHub repo (zero config; Next.js is
  auto-detected), set the two `NEXT_PUBLIC_SUPABASE_*` env vars in
  Project → Settings → Environment Variables.
- **Database**: run `supabase/schema.sql` in the Supabase SQL Editor.

## Tech

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion ·
lucide-react · @supabase/supabase-js · Vercel · Supabase PostgreSQL
