-- ============================================================================
-- ZIMBABWE VISITOR INSURANCE GATEWAY (ZVIG)
-- Supabase PostgreSQL Schema — Backend Prototype
-- ============================================================================
--
-- BUSINESS CONTEXT
-- ----------------
-- ZVIG is a digital insurance distribution and administration platform
-- operated by a Zimbabwean Multiple Agent company, working with a licensed
-- Microinsurance Company as the PRIMARY underwriter.
--
-- This is NOT a multi-insurer marketplace. The visitor sees one brand:
-- "Zimbabwe Visitor Insurance". Underneath, the system manages:
--   - the underwriter (Microinsurance Company)
--   - product ownership
--   - the agency relationship
--   - premium allocation
--   - claims routing
--   - partner insurers (only when specialised products are required)
--
-- Distribution chain modelled by this schema:
--
--   Foreign Visitor
--     -> ZVIG platform (this system)
--       -> Multiple Agency Platform (operator)
--         -> Microinsurance Company (primary underwriter)
--           -> Partner insurers (specialised products only)
--             -> Healthcare providers / ambulances / tourism operators /
--                emergency assistance providers
--
-- HOW TO RUN
-- ----------
-- Execute this file in the Supabase SQL editor (or via `supabase db push`).
-- It is idempotent-ish for prototyping: it drops and recreates everything.
-- DO NOT run against production data.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. CLEAN SLATE (prototype convenience — remove for production migrations)
-- ---------------------------------------------------------------------------
drop table if exists audit_logs cascade;
drop table if exists commissions cascade;
drop table if exists claims cascade;
drop table if exists payments cascade;
drop table if exists policies cascade;
drop table if exists quotes cascade;
drop table if exists travel_details cascade;
drop table if exists customers cascade;
drop table if exists agents cascade;
drop table if exists insurance_products cascade;
drop table if exists organizations cascade;
drop table if exists users cascade;

drop type if exists user_role cascade;
drop type if exists organization_type cascade;
drop type if exists organization_status cascade;
drop type if exists product_category cascade;
drop type if exists travel_purpose cascade;
drop type if exists quote_status cascade;
drop type if exists policy_status cascade;
drop type if exists payment_status cascade;
drop type if exists payment_provider cascade;
drop type if exists claim_status cascade;
drop type if exists agent_status cascade;
drop type if exists commission_status cascade;

-- ---------------------------------------------------------------------------
-- 0.1 ENUM TYPES
-- Enums enforce valid states at the database level. Frontend dropdowns and
-- API validators should mirror these exactly (they are the single source of
-- truth for allowed values).
-- ---------------------------------------------------------------------------

create type user_role as enum ('customer', 'agent', 'admin', 'underwriter_staff', 'support');

create type organization_type as enum (
  'multiple_agency',        -- the ZVIG operating company itself
  'microinsurer',           -- the primary underwriter
  'partner_insurer',        -- specialised-product insurers
  'hospital',               -- healthcare providers accepting ZVIG policies
  'ambulance_service',      -- emergency medical transport
  'tourism_operator',       -- safari companies, hotels, tour operators
  'emergency_assistance'    -- 24/7 assistance companies
);

create type organization_status as enum ('active', 'suspended', 'pending_approval', 'terminated');

create type product_category as enum (
  'medical',                -- core visitor medical cover
  'medical_plus_travel',    -- medical + trip protection bundle
  'adventure',              -- high-risk activities rider (safari, rafting, bungee)
  'transit'                 -- short-stay / airside transit cover
);

create type travel_purpose as enum ('tourism', 'business', 'study', 'transit');

create type quote_status as enum ('draft', 'priced', 'accepted', 'expired', 'converted');

create type policy_status as enum ('pending_payment', 'active', 'expired', 'cancelled', 'suspended');

create type payment_status as enum ('initiated', 'pending', 'succeeded', 'failed', 'refunded');

-- Providers we prepare for. African methods (Paynow/EcoCash) sit alongside
-- international card rails so a UK visitor and a regional visitor both pay
-- through the same payments table.
create type payment_provider as enum ('stripe', 'adyen', 'paypal', 'paynow', 'ecocash', 'manual');

create type claim_status as enum (
  'submitted',              -- customer lodged via portal/WhatsApp
  'under_review',           -- ZVIG ops triaging documents
  'forwarded_to_underwriter', -- routed to the microinsurer for assessment
  'approved',
  'rejected',
  'paid',
  'closed'
);

create type agent_status as enum ('active', 'suspended', 'pending_approval', 'terminated');

create type commission_status as enum ('accrued', 'approved', 'paid', 'clawed_back');

-- ===========================================================================
-- 1. USERS
-- ===========================================================================
create table users (
  id              uuid primary key default gen_random_uuid(),
  -- When Supabase Auth is wired in, this mirrors auth.users.id so RLS
  -- policies can join platform data to the authenticated session.
  auth_user_id    uuid unique,
  name            text not null,
  email           text not null unique,
  phone           text,
  country         text,                       -- ISO 3166-1 alpha-2, e.g. 'GB'
  passport_number text,                       -- ENCRYPT AT REST in production (pgcrypto / vault)
  role            user_role not null default 'customer',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table users is
'All platform identities: visiting customers, distribution agents, ZVIG administrators,
underwriter staff and support agents. Role determines which dashboard the frontend
routes the session to after login.

Connected frontend screens:
- Login / signup (all roles)
- Customer portal (role = customer)
- Agent portal (role = agent)
- Admin command centre (role = admin)

Future API usage:
- auth_user_id links to Supabase Auth for JWT-based RLS on every other table.
- Partner APIs never expose this table directly; they receive scoped tokens.

Insurance business meaning:
The "person" record. A customer here is the POLICYHOLDER identity; their
travelling profile lives in `customers`, which allows one login to hold
multiple trips/policies over years of repeat visits.';

comment on column users.passport_number is
'Sensitive PII. Production must encrypt (pgcrypto) and restrict via RLS +
column-level privileges. Stored on users for identity dedupe; the per-trip
copy used on certificates lives on the customers profile.';

create index idx_users_email on users (email);
create index idx_users_role on users (role);

-- ===========================================================================
-- 2. ORGANIZATIONS
-- ===========================================================================
create table organizations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  type           organization_type not null,
  license_number text,                        -- IPEC licence for insurers/agency
  status         organization_status not null default 'pending_approval',
  contact_email  text,
  contact_phone  text,
  address        text,
  created_at     timestamptz not null default now()
);

comment on table organizations is
'Every corporate entity in the ecosystem: the Multiple Agency (platform operator),
the Microinsurance Company (primary underwriter), partner insurers, hospitals,
ambulance services, tourism operators and emergency assistance companies.

Connected frontend screens:
- Admin command centre (partner management)
- Landing page trust section ("Licensed Insurance Partner")
- Claims page (hospital selection)

Future API usage:
- Partner API keys are issued per-organization; tourism operators and
  universities authenticate as an organization when buying group cover.
- Verification API responses cite the underwriter organization for compliance.

Insurance business meaning:
Encodes the regulatory chain. `license_number` holds the IPEC licence for the
agency and insurers — required on certificates and in audit responses. The
underwriter of every policy is a row here (policies.underwriter_id).';

create index idx_organizations_type on organizations (type);
create index idx_organizations_status on organizations (status);

-- ===========================================================================
-- 3. INSURANCE PRODUCTS
-- ===========================================================================
create table insurance_products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,                    -- e.g. 'Zimbabwe Visitor Premium'
  description      text,
  category         product_category not null,
  provider_id      uuid not null references organizations (id),
  -- Flexible coverage definition consumed by the frontend plan cards and the
  -- premium calculator. Example shape:
  -- { "medical_limit_usd": 30000, "emergency_evacuation": true,
  --   "accident_cover_usd": 5000, "adventure_activities": false,
  --   "base_rate_per_day_usd": 1.5, "min_premium_usd": 30 }
  coverage_details jsonb not null default '{}'::jsonb,
  base_price_usd   numeric(10,2) not null,           -- displayed "from" price
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

comment on table insurance_products is
'The catalogue of visitor insurance products distributed by ZVIG. Each product
is OWNED by a provider organization — normally the primary microinsurer;
partner insurers appear only for specialised products (e.g. extreme adventure).

Connected frontend screens:
- Landing page "Coverage Plans" cards (name, base_price_usd, coverage_details)
- Quote wizard Step 3 (coverage selection)
- Admin command centre (product management)

Future API usage:
- Partner API: tourism operators fetch the catalogue to embed plans in their
  own booking flows.
- WhatsApp bot: reads this table to present "coverage preference" options.

Insurance business meaning:
The visitor never chooses an insurer — only a PRODUCT. provider_id resolves
which underwriter carries the risk, which drives premium allocation and
claims routing without ever surfacing insurer choice to the customer.';

create index idx_products_provider on insurance_products (provider_id);
create index idx_products_active on insurance_products (active) where active;

-- ===========================================================================
-- 4. CUSTOMERS
-- ===========================================================================
create table customers (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references users (id),        -- nullable: WhatsApp/agent-assisted buyers may have no login yet
  full_name        text not null,
  nationality      text not null,                     -- ISO country code
  passport_country text not null,
  passport_number  text not null,                     -- ENCRYPT AT REST in production
  date_of_birth    date not null,
  email            text not null,
  phone            text,
  created_at       timestamptz not null default now()
);

comment on table customers is
'Visitor profiles — the insured persons. Deliberately separate from `users`:
a policy can be bought via WhatsApp or by a travel agent on behalf of a
visitor who never creates a login. user_id back-links when they do register.

Connected frontend screens:
- Quote wizard Step 1 (visitor details form writes here)
- Customer portal (profile display)
- Agent portal "Recent Customers"
- Policy verification page (holder name shown on VALID result)

Future API usage:
- WhatsApp bot creates customer rows from chat-collected details.
- Airline/immigration verification returns holder name + nationality from here.

Insurance business meaning:
The LIFE/RISK being covered. Age (date_of_birth) is a rating factor in the
premium calculation; nationality feeds compliance and sanctions screening.';

create index idx_customers_user on customers (user_id);
create index idx_customers_email on customers (email);
create index idx_customers_passport on customers (passport_number);

-- ===========================================================================
-- 5. TRAVEL DETAILS
-- ===========================================================================
create table travel_details (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references customers (id) on delete cascade,
  arrival_date   date not null,
  departure_date date not null,
  purpose        travel_purpose not null default 'tourism',
  destination    text,                                -- e.g. 'Victoria Falls', 'Harare'
  -- Activities drive risk loading, e.g. ["safari","adventure"] triggers the
  -- adventure premium multiplier in the quote engine.
  activities     text[] not null default '{}',
  created_at     timestamptz not null default now(),
  constraint chk_travel_dates check (departure_date >= arrival_date)
);

comment on table travel_details is
'One trip by one visitor. Quotes and policies reference a trip, so a repeat
visitor accumulates multiple travel_details rows under one customer profile.

Connected frontend screens:
- Quote wizard Step 2 (travel details form writes here)
- Customer portal (policy validity dates derive from the trip)
- Admin command centre ("Active visitors" = trips overlapping today)

Future API usage:
- Airline integration can pre-populate arrival/departure from PNR data.
- Immigration verification cross-checks declared trip dates vs policy dates.

Insurance business meaning:
Defines the PERIOD OF COVER and the RISK PROFILE (purpose + activities).
Duration in days x product day-rate x activity loading = premium.';

create index idx_travel_customer on travel_details (customer_id);
create index idx_travel_dates on travel_details (arrival_date, departure_date);

-- ===========================================================================
-- 6. QUOTES
-- ===========================================================================
create table quotes (
  id                uuid primary key default gen_random_uuid(),
  quote_number      text not null unique,             -- e.g. 'ZVIG-Q-2026-000123'
  customer_id       uuid not null references customers (id),
  travel_detail_id  uuid not null references travel_details (id),
  product_id        uuid not null references insurance_products (id),
  -- Snapshot of the pricing maths so the number can be audited later even if
  -- product rates change. Statutory charges are percentages of the premium:
  -- ZTA levy 2%, stamp duty 5%. Example:
  -- { "days": 20, "day_rate": 1.5, "activity_loading": 1.0, "travellers": 1,
  --   "premium": 30.00, "zta_levy": 0.60, "stamp_duty": 1.50, "total": 32.10 }
  pricing_breakdown jsonb not null default '{}'::jsonb,
  calculated_price  numeric(10,2) not null,
  currency          text not null default 'USD',
  status            quote_status not null default 'draft',
  expires_at        timestamptz,                      -- quotes typically valid 72h
  agent_id          uuid,                             -- FK added after agents table below
  created_at        timestamptz not null default now()
);

comment on table quotes is
'Pre-purchase price offers. A quote binds a customer + trip + product to a
calculated premium. Status = converted once a policy is issued from it.

Connected frontend screens:
- Quote wizard Step 4 (premium calculation displays calculated_price)
- Quote wizard Step 5 (checkout starts from an accepted quote)
- Agent portal (agents generate quotes for walk-in tourists)

Future API usage:
- POST /api/quote — WhatsApp bot and partner booking systems create quotes.
- Abandoned-quote follow-up emails query status = priced and expires_at.

Insurance business meaning:
The OFFER stage of the insurance contract. pricing_breakdown preserves the
rating factors used, which regulators can demand during market-conduct audits.';

create index idx_quotes_customer on quotes (customer_id);
create index idx_quotes_status on quotes (status);

-- ===========================================================================
-- 7. AGENTS
-- ===========================================================================
create table agents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references users (id),
  organization_id uuid references organizations (id), -- hotel / tour operator they belong to, if any
  agent_code      text not null unique,               -- e.g. 'AGT-0007', printed on marketing material
  commission_rate numeric(5,4) not null default 0.10, -- 0.10 = 10% of premium
  total_sales     numeric(12,2) not null default 0,   -- denormalised lifetime premium volume
  status          agent_status not null default 'pending_approval',
  created_at      timestamptz not null default now()
);

comment on table agents is
'Distribution agents: travel agents, tour operators and hotel front desks who
sell ZVIG cover to visitors. Each agent is a platform user (login) optionally
attached to a partner organization.

Connected frontend screens:
- Agent portal dashboard (Visitors Insured, Policies Sold, Commission Earned)
- Admin command centre (agent performance table, approval workflow)

Future API usage:
- Partner API keys can map to an agent for attribution of embedded sales.
- Agent mobile app (future phase) authenticates the same user_id.

Insurance business meaning:
The Multiple Agency’s sub-distribution network. commission_rate is the
agent’s share of premium; the agency’s own margin vs the underwriter is
handled in premium allocation, not in this table.';

create index idx_agents_status on agents (status);

-- Now that agents exists, attach the deferred FK from quotes.
alter table quotes
  add constraint fk_quotes_agent foreign key (agent_id) references agents (id);

-- ===========================================================================
-- 8. POLICIES  (core table)
-- ===========================================================================
create table policies (
  id               uuid primary key default gen_random_uuid(),
  policy_number    text not null unique,              -- e.g. 'ZVIG-2026-00001' — the public identifier
  quote_id         uuid references quotes (id),
  customer_id      uuid not null references customers (id),
  travel_detail_id uuid not null references travel_details (id),
  product_id       uuid not null references insurance_products (id),
  underwriter_id   uuid not null references organizations (id), -- the microinsurer carrying the risk
  agent_id         uuid references agents (id),       -- attribution for commission
  start_date       date not null,
  end_date         date not null,
  premium          numeric(10,2) not null,
  currency         text not null default 'USD',
  status           policy_status not null default 'pending_payment',
  certificate_url  text,                              -- Supabase Storage path to the generated PDF
  qr_code          text,                              -- payload encoded in the certificate QR (verification URL)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint chk_policy_dates check (end_date >= start_date)
);

comment on table policies is
'THE CORE TABLE. Every issued visitor insurance policy. policy_number is the
public identifier printed on certificates, shown at borders and quoted in
emergencies.

Connected frontend screens:
- Customer portal dashboard (status badge, policy number, validity, actions)
- Policy verification page (public lookup by policy_number)
- Claims page (a claim must reference an active/expired policy)
- Agent portal (policies sold list)
- Admin command centre ("Policies issued today", revenue)

Future API usage:
- GET /api/policy/{number} — verification by borders, hotels, airlines.
- POST /api/policy/create — issuance from WhatsApp bot and partner systems.
- qr_code lets an immigration officer scan the certificate and hit the
  public verification endpoint without typing.

Insurance business meaning:
The BOUND CONTRACT. underwriter_id records which insurer carries the risk
(normally the primary microinsurer) — this drives premium remittance and
claims routing while the customer only ever sees the ZVIG brand.';

create index idx_policies_number on policies (policy_number);
create index idx_policies_customer on policies (customer_id);
create index idx_policies_status on policies (status);
create index idx_policies_dates on policies (start_date, end_date);
create index idx_policies_agent on policies (agent_id);

-- ===========================================================================
-- 9. PAYMENTS
-- ===========================================================================
create table payments (
  id                    uuid primary key default gen_random_uuid(),
  policy_id             uuid references policies (id),
  quote_id              uuid references quotes (id),   -- payment may precede policy issuance
  customer_id           uuid not null references customers (id),
  amount                numeric(10,2) not null,
  currency              text not null default 'USD',
  provider              payment_provider not null,
  transaction_reference text unique,                   -- provider-side id (Stripe pi_..., Paynow ref)
  status                payment_status not null default 'initiated',
  -- Raw webhook payload snapshot for reconciliation/disputes.
  provider_payload      jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table payments is
'Premium payment attempts and results across all rails: Stripe/Adyen/PayPal
for international cards and wallets, Paynow/EcoCash for regional visitors,
manual for agent-collected cash.

Connected frontend screens:
- Quote wizard Step 5 (checkout creates an initiated payment)
- Customer portal (receipt/history — future)
- Admin command centre (revenue metrics)

Future API usage:
- Payment webhook handlers (Next.js API routes / Edge Functions) update
  status by transaction_reference, then trigger policy activation and
  certificate generation.
- Reconciliation jobs compare provider_payload against provider statements.

Insurance business meaning:
PREMIUM COLLECTION. A policy only moves pending_payment -> active when a
payment row reaches status = succeeded. Refunded payments trigger policy
cancellation review.';

create index idx_payments_policy on payments (policy_id);
create index idx_payments_status on payments (status);
create index idx_payments_reference on payments (transaction_reference);

-- ===========================================================================
-- 10. CLAIMS
-- ===========================================================================
create table claims (
  id             uuid primary key default gen_random_uuid(),
  claim_number   text not null unique,                -- e.g. 'ZVIG-C-2026-0001'
  policy_id      uuid not null references policies (id),
  incident_date  date not null,
  description    text not null,
  location       text,                                -- where the incident happened
  -- Array of Supabase Storage paths: medical reports, receipts, photos.
  documents      jsonb not null default '[]'::jsonb,
  status         claim_status not null default 'submitted',
  assessor_notes text,                                -- underwriter/ops notes, internal only
  approved_amount numeric(10,2),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table claims is
'Claims initiated by visitors against their policies. ZVIG performs INTAKE
and triage; assessment/settlement authority sits with the underwriter.

Connected frontend screens:
- Claims page (customer submits incident date, description, documents, photos, location)
- Customer portal ("Submit Claim" action, claim status tracking)
- Admin command centre (claims metrics, triage queue)

Future API usage:
- WhatsApp bot creates claims with chat-uploaded photos.
- Hospital partner API can attach treatment documents directly to a claim.
- Status webhooks notify the customer by email/WhatsApp on every transition.

Insurance business meaning:
The INDEMNITY side of the contract. Status flow: submitted -> under_review ->
forwarded_to_underwriter -> approved/rejected -> paid -> closed. approved_amount
is set by the underwriter, never by ZVIG staff (segregation of duties).';

create index idx_claims_policy on claims (policy_id);
create index idx_claims_status on claims (status);

-- ===========================================================================
-- 11. COMMISSIONS
-- ===========================================================================
create table commissions (
  id         uuid primary key default gen_random_uuid(),
  agent_id   uuid not null references agents (id),
  policy_id  uuid not null references policies (id),
  amount     numeric(10,2) not null,
  currency   text not null default 'USD',
  status     commission_status not null default 'accrued',
  paid_at    timestamptz,
  created_at timestamptz not null default now(),
  constraint uq_commission_per_policy unique (agent_id, policy_id)
);

comment on table commissions is
'Per-policy commission earned by distribution agents. One row per agent per
policy (enforced by unique constraint). Amount = policy.premium x
agents.commission_rate at time of issuance.

Connected frontend screens:
- Agent portal ("Commission Earned" metric and statement list)
- Admin command centre (commission liability, payout runs)

Future API usage:
- Monthly payout jobs aggregate status = approved into payment batches.
- Agent statements API for partner organizations (hotels reconciling desks).

Insurance business meaning:
Remuneration ledger for the sub-distribution network. clawed_back status
handles cancelled/refunded policies where commission must be reversed —
a regulatory expectation for agency accounting.';

create index idx_commissions_agent on commissions (agent_id);
create index idx_commissions_status on commissions (status);

-- ===========================================================================
-- 12. AUDIT LOGS
-- ===========================================================================
create table audit_logs (
  id         bigint generated always as identity primary key,
  user_id    uuid references users (id),              -- null for system/webhook actions
  action     text not null,                           -- e.g. 'policy.issued', 'claim.status_changed'
  entity     text not null,                           -- table name, e.g. 'policies'
  entity_id  uuid,                                    -- row affected
  old_value  jsonb,
  new_value  jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

comment on table audit_logs is
'Append-only compliance trail. Every material state change (policy issuance,
claim decisions, payment status, role changes) writes a row, either from
application code or via triggers in a later iteration.

Connected frontend screens:
- Admin command centre (activity feed / audit viewer)

Future API usage:
- Regulator (IPEC) reporting extracts.
- Fraud monitoring jobs scan patterns (e.g. many policies from one IP).

Insurance business meaning:
Regulatory record-keeping. Insurance law requires demonstrable audit trails
for policy and claims administration; this table is intentionally append-only
(no update/delete granted to any application role).';

create index idx_audit_entity on audit_logs (entity, entity_id);
create index idx_audit_created on audit_logs (created_at);

-- ===========================================================================
-- ROW LEVEL SECURITY — PREPARATION
-- ===========================================================================
-- RLS is ENABLED on all tables now so nothing is accidentally exposed when
-- the anon key is used. Policies below are the prototype baseline; they will
-- be tightened when Supabase Auth is integrated (auth.uid() = users.auth_user_id).
-- ===========================================================================

alter table users             enable row level security;
alter table organizations     enable row level security;
alter table insurance_products enable row level security;
alter table customers         enable row level security;
alter table travel_details    enable row level security;
alter table quotes            enable row level security;
alter table agents            enable row level security;
alter table policies          enable row level security;
alter table payments          enable row level security;
alter table claims            enable row level security;
alter table commissions       enable row level security;
alter table audit_logs        enable row level security;

-- Public catalogue: anyone (anon) may read active products — powers the
-- landing page plan cards without authentication.
create policy "public read active products"
  on insurance_products for select
  using (active = true);

-- Public verification: the verification page/API needs limited policy reads.
-- PROTOTYPE NOTE: production should replace this with a SECURITY DEFINER
-- function returning only (status, holder name, nationality, end_date,
-- coverage summary) rather than exposing full rows.
create policy "public verify policies"
  on policies for select
  using (true);

create policy "public read customers for verification"
  on customers for select
  using (true);

-- Authenticated users manage their own identity row.
create policy "users read own record"
  on users for select
  using (auth.uid() = auth_user_id);

create policy "users update own record"
  on users for update
  using (auth.uid() = auth_user_id);

-- Everything else is DENIED by default (RLS on, no policy = no access).
-- Service-role keys (server-side API routes, Edge Functions, webhook
-- handlers) bypass RLS and perform issuance, payments and claims writes.

-- ===========================================================================
-- SAMPLE MOCK DATA
-- Mirrors the frontend prototype's mock data so the two halves can be merged
-- without reshaping anything.
-- ===========================================================================

-- --- Organizations -----------------------------------------------------------
insert into organizations (id, name, type, license_number, status, contact_email) values
  ('11111111-1111-1111-1111-111111111111', 'ZVIG Multiple Agency (Pvt) Ltd', 'multiple_agency', 'IPEC-MA-2026-041', 'active', 'ops@zvig.co.zw'),
  ('22222222-2222-2222-2222-222222222222', 'Horizon Microinsurance Company', 'microinsurer', 'IPEC-MI-2024-007', 'active', 'underwriting@horizonmicro.co.zw'),
  ('33333333-3333-3333-3333-333333333333', 'Savanna Specialty Insurers', 'partner_insurer', 'IPEC-IN-2023-019', 'active', 'partners@savannaspecialty.co.zw'),
  ('44444444-4444-4444-4444-444444444444', 'Victoria Falls Private Hospital', 'hospital', null, 'active', 'admissions@vfph.co.zw'),
  ('55555555-5555-5555-5555-555555555555', 'Shearwater Adventures', 'tourism_operator', null, 'active', 'bookings@shearwater.co.zw'),
  ('66666666-6666-6666-6666-666666666666', 'MARS Ambulance Zimbabwe', 'ambulance_service', null, 'active', 'dispatch@mars.co.zw');

-- --- Products ---------------------------------------------------------------
-- Single-product catalogue for launch: Zimbabwe Visitor Premium at USD 30.
-- Further plans are simply new rows here when the business adds them.
insert into insurance_products (id, name, description, category, provider_id, coverage_details, base_price_usd, active) values
  ('aaaaaaa1-0000-0000-0000-000000000002',
   'Zimbabwe Visitor Premium',
   'Medical and emergency cover with travel protection and safari assistance.',
   'medical_plus_travel',
   '22222222-2222-2222-2222-222222222222',
   '{"medical_limit_usd": 30000, "emergency_assistance": true, "accident_cover_usd": 5000, "travel_protection": true, "safari_assistance": true, "adventure_activities": false, "evacuation": true, "base_rate_per_day_usd": 1.50, "min_premium_usd": 30}',
   30.00, true);

-- --- Users ------------------------------------------------------------------
insert into users (id, name, email, phone, country, role) values
  ('bbbbbbb1-0000-0000-0000-000000000001', 'John Smith', 'john.smith@example.com', '+447700900123', 'GB', 'customer'),
  ('bbbbbbb1-0000-0000-0000-000000000002', 'Tendai Moyo', 'tendai@shearwater.co.zw', '+263771234567', 'ZW', 'agent'),
  ('bbbbbbb1-0000-0000-0000-000000000003', 'Rufaro Chikwava', 'admin@zvig.co.zw', '+263772345678', 'ZW', 'admin');

-- --- Customers & trip -------------------------------------------------------
insert into customers (id, user_id, full_name, nationality, passport_country, passport_number, date_of_birth, email, phone) values
  ('ccccccc1-0000-0000-0000-000000000001',
   'bbbbbbb1-0000-0000-0000-000000000001',
   'John Smith', 'GB', 'GB', 'P123456789', '1988-04-12',
   'john.smith@example.com', '+447700900123');

insert into travel_details (id, customer_id, arrival_date, departure_date, purpose, destination, activities) values
  ('ddddddd1-0000-0000-0000-000000000001',
   'ccccccc1-0000-0000-0000-000000000001',
   '2026-08-01', '2026-08-20', 'tourism', 'Victoria Falls', '{safari,general}');

-- --- Agent ------------------------------------------------------------------
insert into agents (id, user_id, organization_id, agent_code, commission_rate, total_sales, status) values
  ('eeeeeee1-0000-0000-0000-000000000001',
   'bbbbbbb1-0000-0000-0000-000000000002',
   '55555555-5555-5555-5555-555555555555',
   'AGT-0001', 0.1000, 1240.00, 'active');

-- --- Quote -> Policy -> Payment ---------------------------------------------
insert into quotes (id, quote_number, customer_id, travel_detail_id, product_id, pricing_breakdown, calculated_price, status, expires_at, agent_id) values
  ('fffffff1-0000-0000-0000-000000000001',
   'ZVIG-Q-2026-000001',
   'ccccccc1-0000-0000-0000-000000000001',
   'ddddddd1-0000-0000-0000-000000000001',
   'aaaaaaa1-0000-0000-0000-000000000002',
   '{"days": 20, "day_rate": 1.50, "activity_loading": 1.0, "travellers": 1, "premium": 30.00, "zta_levy": 0.60, "stamp_duty": 1.50, "total": 32.10}',
   32.10, 'converted', '2026-07-20T00:00:00Z',
   'eeeeeee1-0000-0000-0000-000000000001');

insert into policies (id, policy_number, quote_id, customer_id, travel_detail_id, product_id, underwriter_id, agent_id, start_date, end_date, premium, status, certificate_url, qr_code) values
  ('99999991-0000-0000-0000-000000000001',
   'ZVIG-2026-00001',
   'fffffff1-0000-0000-0000-000000000001',
   'ccccccc1-0000-0000-0000-000000000001',
   'ddddddd1-0000-0000-0000-000000000001',
   'aaaaaaa1-0000-0000-0000-000000000002',
   '22222222-2222-2222-2222-222222222222',
   'eeeeeee1-0000-0000-0000-000000000001',
   '2026-08-01', '2026-08-20', 30.00, 'active',
   'certificates/ZVIG-2026-00001.pdf',
   'https://zvig.co.zw/verify/ZVIG-2026-00001');

insert into payments (policy_id, quote_id, customer_id, amount, currency, provider, transaction_reference, status) values
  ('99999991-0000-0000-0000-000000000001',
   'fffffff1-0000-0000-0000-000000000001',
   'ccccccc1-0000-0000-0000-000000000001',
   32.10, 'USD', 'stripe', 'pi_3PmockZVIG0001', 'succeeded');

insert into commissions (agent_id, policy_id, amount, status) values
  ('eeeeeee1-0000-0000-0000-000000000001',
   '99999991-0000-0000-0000-000000000001',
   3.00, 'accrued');

-- --- Sample claim ------------------------------------------------------------
insert into claims (claim_number, policy_id, incident_date, description, location, documents, status) values
  ('ZVIG-C-2026-0001',
   '99999991-0000-0000-0000-000000000001',
   '2026-08-09',
   'Sprained ankle during guided gorge hike; treated at Victoria Falls Private Hospital.',
   'Batoka Gorge, Victoria Falls',
   '["claims/ZVIG-C-2026-0001/medical-report.pdf", "claims/ZVIG-C-2026-0001/receipt.jpg"]',
   'under_review');

-- --- Audit trail examples -----------------------------------------------------
insert into audit_logs (user_id, action, entity, entity_id, old_value, new_value) values
  ('bbbbbbb1-0000-0000-0000-000000000003', 'policy.issued', 'policies', '99999991-0000-0000-0000-000000000001',
   null, '{"policy_number": "ZVIG-2026-00001", "status": "active"}'),
  (null, 'payment.succeeded', 'payments', null,
   '{"status": "initiated"}', '{"status": "succeeded", "provider": "stripe"}'),
  (null, 'claim.status_changed', 'claims', null,
   '{"status": "submitted"}', '{"status": "under_review"}');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
