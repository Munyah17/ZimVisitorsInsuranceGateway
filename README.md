# Hola Amigo Travelmate (Zimbabwe Visitor Insurance Gateway)

Digital insurance distribution and administration platform for foreign
visitors to Zimbabwe, operated by Hola Amigo Multiple Agent and underwritten
by a licensed Microinsurance Company. The customer sees one brand, **Hola
Amigo Travelmate**; the platform manages the underwriter, product ownership,
premium allocation and claims routing underneath.

> **Prototype** — the frontend runs entirely on mock data; the SQL file is a
> complete, commented Supabase schema ready to deploy. Not an offer of insurance.

## What's in this repo

| Part | Location | Description |
|---|---|---|
| **A — Frontend prototype** | `app/`, `components/`, `lib/` | Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn-style UI + Framer Motion. Mock data only. |
| **B — Backend prototype** | `supabase/schema.sql` | Complete PostgreSQL schema: 12 tables, enums, FKs, indexes, RLS, seed data — every table commented with frontend + API + insurance meaning. |
| **C — Integration blueprint** | `docs/INTEGRATION_BLUEPRINT.md` | How frontend ⇄ Supabase ⇄ payments ⇄ WhatsApp ⇄ future mobile apps connect. |

## Screens

- `/` — Landing page (hero slider, why-insurance, coverage plans, trust)
- `/quote` — 6-step quote wizard: visitor → travel → coverage → premium → checkout → certificate
- `/portals` — Login/Signup with demo credentials (client, agent, admin)
- `/portal` — Client portal (active policy, days left, coverage, emergency assistance)
- `/verify` — Public policy verification (try `ZVIG-2026-00001`)
- `/claims` — Claim submission + tracking timeline
- `/agent` — Agent portal (sales, commissions, recent customers)
- `/admin` — Admin command centre (KPIs, countries, agents, claims queue)
- `/super-admin` — hidden Super Admin console (passcode `SUPER-2026`): feature
  flags, gateways, pricing, users & roles, API keys, audit, system health

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

No backend needed. To prepare the live connection, copy `.env.local.example`
to `.env.local` and fill in your Supabase project URL + anon key.

## Deploy

- **Frontend**: Vercel — import this GitHub repo (zero config; Next.js is
  auto-detected), set the two `NEXT_PUBLIC_SUPABASE_*` env vars in
  Project → Settings → Environment Variables.
- **Database**: run `supabase/schema.sql` in the Supabase SQL Editor.

## Tech

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion ·
lucide-react · @supabase/supabase-js · Vercel · Supabase PostgreSQL
