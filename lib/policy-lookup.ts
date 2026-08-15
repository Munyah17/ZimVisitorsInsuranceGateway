/**
 * Shared live policy lookup for GET /api/policy/[number] (public
 * verification) and GET /api/certificate/[number] (PDF generation).
 * Uses the anon client — RLS ("public verify policies" / "public read
 * customers for verification") is what actually scopes the read, so this
 * is safe to call from a public, unauthenticated route.
 */

import { getSupabase } from "@/lib/supabase";

export interface LivePolicy {
  policyNumber: string;
  status: string;
  holderName: string;
  nationality: string;
  startDate: string;
  endDate: string;
  premium: number;
  currency: string;
  productName: string;
  coverageSummary: string;
}

function summarizeCoverage(details: Record<string, unknown> | null): string {
  if (!details) return "Medical + Emergency Assistance";
  const parts: string[] = [];
  if (details.medical_limit_usd) parts.push(`$${details.medical_limit_usd} medical`);
  if (details.emergency_assistance) parts.push("Emergency assistance");
  if (details.travel_protection) parts.push("Travel protection");
  if (details.safari_assistance) parts.push("Safari assistance");
  if (details.evacuation) parts.push("Evacuation");
  return parts.length > 0 ? parts.join(" + ") : "Medical + Emergency Assistance";
}

export async function fetchLivePolicy(rawNumber: string): Promise<LivePolicy | null> {
  const policyNumber = rawNumber.trim().toUpperCase();
  if (!policyNumber) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("policies")
    .select(
      "policy_number, status, start_date, end_date, premium, currency, customers(full_name, nationality), insurance_products(name, coverage_details)"
    )
    .eq("policy_number", policyNumber)
    .maybeSingle();

  if (error || !data) return null;

  const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;
  const product = Array.isArray(data.insurance_products)
    ? data.insurance_products[0]
    : data.insurance_products;

  return {
    policyNumber: data.policy_number as string,
    status: data.status as string,
    holderName: (customer?.full_name as string) ?? "",
    nationality: (customer?.nationality as string) ?? "",
    startDate: data.start_date as string,
    endDate: data.end_date as string,
    premium: Number(data.premium),
    currency: (data.currency as string) ?? "USD",
    productName: (product?.name as string) ?? "Zimbabwe Visitor Premium",
    coverageSummary: summarizeCoverage(
      (product?.coverage_details as Record<string, unknown>) ?? null
    ),
  };
}
