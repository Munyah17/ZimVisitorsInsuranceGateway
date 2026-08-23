/**
 * GET /api/agent/data — everything the agent portal pages need, scoped to
 * the logged-in agent's own sales. Requires an agent session; see
 * lib/require-role.ts.
 */

import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/require-role";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const identity = await requireAgent(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdmin();

  const [{ data: policyRows }, { data: commissionRows }] = await Promise.all([
    admin
      .from("policies")
      .select("policy_number, premium, status, start_date, end_date, created_at, customers(full_name, nationality)")
      .eq("agent_id", identity.agentId)
      .order("created_at", { ascending: false }),
    admin
      .from("commissions")
      .select("amount, status, created_at, policies(policy_number)")
      .eq("agent_id", identity.agentId)
      .order("created_at", { ascending: false }),
  ]);

  const policies = (policyRows ?? []).map((p) => {
    const customer = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    return {
      policyNumber: p.policy_number as string,
      name: (customer?.full_name as string) ?? "—",
      country: (customer?.nationality as string) ?? "—",
      premium: Number(p.premium),
      status: p.status as string,
      startDate: p.start_date as string,
      endDate: p.end_date as string,
      date: p.created_at as string,
    };
  });

  const commissions = (commissionRows ?? []).map((c) => {
    const policy = Array.isArray(c.policies) ? c.policies[0] : c.policies;
    return {
      policyNumber: (policy?.policy_number as string) ?? "—",
      amount: Number(c.amount),
      status: c.status as string,
      date: c.created_at as string,
    };
  });

  const commissionEarned = commissions.reduce((s, c) => s + c.amount, 0);
  const visitorsInsured = new Set(policies.map((p) => p.policyNumber)).size;

  return NextResponse.json({
    profile: {
      name: identity.name,
      agentCode: identity.agentCode,
      organization: identity.orgName,
      commissionRate: identity.commissionRate,
    },
    stats: {
      visitorsInsured,
      policiesSold: policies.length,
      commissionEarned,
    },
    policies,
    commissions,
  });
}
