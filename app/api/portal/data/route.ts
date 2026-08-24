/**
 * GET /api/portal/data — everything the customer portal needs, scoped to
 * the logged-in customer's own policies. A `customers` row is created
 * fresh at every checkout (see lib/payment-gateways/fulfillment.ts) and is
 * linked back to `users` either by `user_id` (set when the buyer was
 * logged in at checkout) or by matching email (covers older/unlinked
 * rows and group members bought under the same address).
 */

import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/require-role";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { summarizeCoverage } from "@/lib/policy-lookup";

const OPEN_CLAIM_STATUSES = ["submitted", "under_review", "forwarded_to_underwriter", "approved"];

export async function GET(request: Request) {
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const identity = await requireCustomer(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdmin();

  // Two separate lookups (not a single .or() filter) so nothing built from
  // the caller's email ever has to be interpolated into a PostgREST filter
  // string.
  const [byUserId, byEmail] = await Promise.all([
    admin
      .from("customers")
      .select("id, full_name, nationality, passport_number, email, phone, created_at")
      .eq("user_id", identity.userId),
    admin
      .from("customers")
      .select("id, full_name, nationality, passport_number, email, phone, created_at")
      .ilike("email", identity.email),
  ]);

  const customerRows = Array.from(
    new Map(
      [...(byUserId.data ?? []), ...(byEmail.data ?? [])].map((c) => [c.id as string, c])
    ).values()
  );
  const customerIds = customerRows.map((c) => c.id as string);

  if (customerIds.length === 0) {
    return NextResponse.json({
      profile: { name: identity.name, email: identity.email, nationality: null, passportNumber: null },
      stats: { active: 0, expired: 0, totalPremiums: 0, openClaims: 0 },
      policies: [],
    });
  }

  const { data: policyRows } = await admin
    .from("policies")
    .select(
      "id, policy_number, status, start_date, end_date, premium, currency, created_at, customers(full_name, nationality, passport_number), insurance_products(name, coverage_details)"
    )
    .in("customer_id", customerIds)
    .order("created_at", { ascending: false });

  const policyIds = (policyRows ?? []).map((p) => p.id as string);

  const { data: claimRows } = policyIds.length
    ? await admin.from("claims").select("status").in("policy_id", policyIds)
    : { data: [] as { status: string }[] };

  const policies = (policyRows ?? []).map((p) => {
    const customer = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    const product = Array.isArray(p.insurance_products) ? p.insurance_products[0] : p.insurance_products;
    return {
      policyNumber: p.policy_number as string,
      holderName: (customer?.full_name as string) ?? identity.name,
      nationality: (customer?.nationality as string) ?? null,
      productName: (product?.name as string) ?? "Zim Travelmate cover",
      coverageSummary: summarizeCoverage((product?.coverage_details as Record<string, unknown>) ?? null),
      startDate: p.start_date as string,
      endDate: p.end_date as string,
      premium: Number(p.premium),
      currency: (p.currency as string) ?? "USD",
      status: p.status as string,
    };
  });

  const active = policies.filter((p) => p.status === "active").length;
  const expired = policies.filter((p) => p.status === "expired").length;
  const totalPremiums = policies
    .filter((p) => p.status === "active" || p.status === "expired")
    .reduce((sum, p) => sum + p.premium, 0);
  const openClaims = (claimRows ?? []).filter((c) => OPEN_CLAIM_STATUSES.includes(c.status)).length;

  // Most recently issued customer identity — the freshest real details on file.
  const latestCustomer = (customerRows ?? []).slice().sort(
    (a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
  )[0];

  return NextResponse.json({
    profile: {
      name: identity.name,
      email: identity.email,
      nationality: (latestCustomer?.nationality as string) ?? null,
      passportNumber: (latestCustomer?.passport_number as string) ?? null,
    },
    stats: { active, expired, totalPremiums, openClaims },
    policies,
  });
}
