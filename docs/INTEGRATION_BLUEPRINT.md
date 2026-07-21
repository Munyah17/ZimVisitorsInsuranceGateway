# Travelmate Zim Integration Blueprint

How the three prototype parts — the Next.js frontend (mock data), the Supabase
schema (`supabase/schema.sql`) and future channels (WhatsApp, SMS, payments,
mobile apps, partner APIs) — become one production platform.

---

## 1. System architecture

```
Foreign Visitor ──▶ Web app (Next.js on Vercel)
                    WhatsApp bot (Cloud API)
                    Mobile apps (future: Android / iOS)
                         │
                         ▼
              Next.js API routes + Supabase Edge Functions
              (issuance, quoting, payments, verification)
                         │
                         ▼
                Supabase PostgreSQL  ◀── Row Level Security
                Supabase Auth · Storage (certificates, claim docs)
                         │
                         ▼
   Multiple Agency ─▶ Microinsurance Co. (primary underwriter)
                      Partner insurers (specialised products)
                      Hospitals · Ambulances · Tourism operators
```

The customer always sees **one brand** — "Travelmate Zim". The
underwriter, agency split, premium allocation and claims routing are resolved
internally via `policies.underwriter_id`, `agents`, and `commissions`.

---

## 2. Frontend ⇄ Supabase

### 2.1 Deploy the schema

Run `supabase/schema.sql` in the Supabase SQL Editor (project
`hteouvowlkctgvseapvy`). It creates all tables, enables RLS, and seeds the
same mock data the frontend uses — so screens light up immediately.

### 2.2 Swap mock data for queries

`lib/supabase.ts` is already wired; every mock type in `lib/mock-data.ts`
mirrors a table. Replacement map:

| Screen | Mock source | Live query |
|---|---|---|
| Landing plan cards | `FEATURED_PRODUCTS` | `from("insurance_products").select().eq("active", true)` |
| Quote wizard steps 1–2 | local state | insert `customers`, `travel_details` |
| Quote wizard step 4 | `lib/quote-engine.ts` | Edge Function `POST /api/quote` → `quotes` row |
| Quote wizard step 6 | simulated | `POST /api/policy/create` (server) → `policies` |
| Customer portal | `MOCK_CUSTOMER` | `policies` joined to `customers` via Supabase Auth session |
| Verify page | `findPolicy()` | `GET /api/policy/{number}` (SECURITY DEFINER function) |
| Claims page | simulated | insert `claims`; upload files to Storage bucket `claims/` |
| Agent portal | `MOCK_AGENT` | `agents` + `commissions` + `policies` filtered by `user_id` |
| Admin centre | `MOCK_ADMIN` | aggregate views over `policies`, `payments`, `claims` |

### 2.3 Auth

1. Enable Supabase Auth (email OTP + Google). On signup, a trigger inserts a
   `users` row with `auth_user_id = auth.uid()`.
2. RLS policies (already stubbed in the schema) tighten to
   `auth.uid() = users.auth_user_id` joins.
3. Roles (`customer` / `agent` / `admin`) route to `/portal`, `/agent`,
   `/admin`. Middleware checks the role claim in the JWT.

### 2.4 Key rules

- **Anon key** (browser): read-only on active products + limited verification.
- **Service-role key** (server only — Vercel env var, never `NEXT_PUBLIC_`):
  policy issuance, payment webhooks, claims transitions, certificate writes.

---

## 3. API layer

Implemented as Next.js Route Handlers (running on Vercel Functions with
Fluid Compute) or Supabase Edge Functions — both talk to the same tables.

| Endpoint | Consumer | Behaviour |
|---|---|---|
| `POST /api/quote` | web, WhatsApp, partners | price a trip; writes `quotes` with `pricing_breakdown` |
| `POST /api/policy/create` | web checkout, bot, partners | quote → policy after payment success; generates PDF + QR |
| `GET /api/policy/{number}` | borders, hotels, airlines | public, rate-limited; returns status, holder, nationality, expiry, coverage summary only |
| `POST /api/claims` | portal, bot, hospital partners | claim intake + document links |
| `POST /api/webhooks/stripe` · `/paynow` | payment providers | verify signature → `payments.status = succeeded` → activate policy → email certificate |
| `POST /api/webhooks/whatsapp` | Meta Cloud API | conversation engine (below) |
| Partner API (`/api/partner/*`) | tourism cos, universities, airlines | org-scoped API keys (`organizations`), group purchases, embedded quotes |

Verification QR on every certificate encodes
`https://<domain>/verify?n=ZVIG-2026-00001` — scanning opens the public verify
page which calls `GET /api/policy/{number}`.

---

## 4. Payments

One `payments` table, many rails:

- **Stripe / Adyen / PayPal** — international cards & wallets. Checkout creates
  a `payments` row (`status = initiated`) + provider session; webhook flips it
  to `succeeded`.
- **Paynow / EcoCash** — regional mobile money, same lifecycle via Paynow's
  poll/result URL.
- **Agent-collected cash** — `provider = manual`, recorded by agents, settled
  against their commission statement.

Policy activation is *always* webhook-driven (`pending_payment → active`),
never trusted from the browser. `provider_payload` stores the raw webhook for
reconciliation and disputes.

---

## 5. WhatsApp chatbot

```
Visitor ⇄ WhatsApp ⇄ Meta Cloud API ⇄ POST /api/webhooks/whatsapp
                                          │  conversation engine
                                          │  (state machine per phone number)
                                          ▼
                              Supabase (customers, quotes, policies)
                                          ▼
                              Payment link (Stripe/Paynow) → certificate PDF
```

- **Menu**: 1 Buy Insurance · 2 Check Existing Policy · 3 Emergency
  Assistance · 4 Speak to Agent.
- **Buy flow** collects nationality, travel dates, purpose, age, coverage
  preference, email, passport → `POST /api/quote` → payment link → on webhook
  success the certificate PDF is sent back in-chat.
- **Verify** replies with status, expiry, coverage, emergency contact.
- **Emergency** shows buttons (Medical / Ambulance / Support / Nearest
  hospital — from `organizations`).
- **Escalation** hands the thread to support/claims/agents with full context.
- Conversation state lives in a `whatsapp_sessions` table (phase-2 migration);
  every issued policy reuses the exact same tables as the web flow.

---

## 6. SMS messaging

A bulk + transactional SMS gateway (e.g. a local aggregator or Africa's
Talking) sends three kinds of message, all triggered from the same
`policies`/`claims` events that drive email:

- **Automatic — thank you**: fires on `payments.status = succeeded`, same
  moment the certificate email sends.
- **Automatic — lapse reminder**: a scheduled job queries
  `policies.end_date` 48 hours out and sends one SMS per policy.
- **Automatic — claim status**: fires on every `claims.status` transition.
- **Manual / bulk**: ops staff compose a message in the Super Admin console
  and target a recipient group (all active policyholders, expiring this
  week, all agents, or a single number) — `POST /api/messages/send`,
  logged the same way as the automatic sends.

Every send (automatic or manual) writes one row to a `messages` table
(phase-2 migration: recipient, type, body, provider delivery status) so the
Super Admin message log and per-customer history both read from one source
of truth.

---

## 7. Certificates & documents

- Edge Function renders the certificate PDF (policy number, holder, dates,
  underwriter licence, QR) → Supabase Storage `certificates/` →
  `policies.certificate_url`.
- Claim documents/photos upload to `claims/{claim_number}/` with signed URLs;
  paths land in `claims.documents`.

---

## 8. Future mobile apps

Android/iOS consume the **same API layer** — no new backend:

- Supabase Auth SDKs for login (same `users` rows).
- `GET /api/policy/*`, `POST /api/quote`, `POST /api/claims` as on web.
- Offline certificate cache + QR display; push notifications on claim status
  changes (webhook → FCM/APNs).

---

## 9. System integrations

The Super Admin console's **Integrations** panel is the operational view of
this list — each row toggles/monitors one of these connections:

| System | Direction | Purpose |
|---|---|---|
| WhatsApp Business Cloud API | In/out | Purchases, verification, support (§5) |
| SMS gateway | Out | Transactional + bulk messaging (§6) |
| Airline partner API (e.g. Air Zimbabwe) | In | Pre-fill itinerary from a booking reference |
| Immigration / ZTA verification | In/out | Border checks against `policies`; satisfies Zimbabwe Tourism Authority reporting |
| Hospital & clinic EMR sync | In/out | Direct billing on claims with `organizations` of type `hospital` |
| Accounting export (Xero/QuickBooks) | Out | Revenue and commission ledger sync for finance |
| Payment gateways | In/out | See §4 |

Each integration is a scoped, authenticated Next.js API route or Supabase
Edge Function with its own audit trail entry (`audit_logs`) and, where the
integration is inbound, an entry in `organizations` + a partner API key
(§3's Partner API). New integrations do not require schema changes — they
read/write the same core tables as the web and WhatsApp channels.

---

## 10. Hosting & environments (Vercel)

- **Frontend**: Vercel, auto-deploy from GitHub `main`
  (`Munyah17/ZimVisitorsInsuranceGateway`). Next.js is detected with zero
  configuration; App Router pages and API routes run on Vercel Functions.
- **Env vars** in Vercel (Project → Settings → Environment Variables):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` now;
  service-role, Stripe, Paynow and WhatsApp secrets when the backend goes
  live. Manage from the CLI with `vercel env` if preferred.
- **Preview deploys** per pull request for stakeholder demos; production
  promotions and instant rollbacks from the Vercel dashboard.
- **Backend**: Supabase (database, auth, storage, edge functions) — deploy
  schema changes via `supabase db push` / migrations.

---

## 11. Security checklist

- RBAC via `users.role` + RLS on every table (deny-by-default, already on).
- Passport numbers: encrypt at rest (pgcrypto) + column privileges; masked in
  UI (`P123•••789`).
- Public verification discloses only status/holder/nationality/expiry/coverage.
- Append-only `audit_logs` for every material state change (IPEC compliance).
- API keys per partner organization; rate limiting on public endpoints
  (Vercel Firewall rate limiting / Supabase).
- Fraud preparation: audit pattern scans (many policies per IP, reused
  passports), payment/provider reconciliation jobs.
