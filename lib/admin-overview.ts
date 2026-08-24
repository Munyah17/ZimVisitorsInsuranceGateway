/**
 * Shared aggregate business/operations query — used by both the regular
 * Admin dashboard (/api/admin/data, gated by lib/require-role.ts) and the
 * Super Admin console's Overview (/api/private/overview, gated by the
 * /private session cookie). Same real data either way; only who's allowed
 * to see it differs.
 */

import { getSupabaseAdmin } from "@/lib/supabase-admin";

const OPEN_CLAIM_STATUSES = ["submitted", "under_review", "forwarded_to_underwriter"];

function startOfToday(): string {
  return new Date(new Date().toDateString()).toISOString();
}
function startOfYear(): string {
  return new Date(new Date().getFullYear(), 0, 1).toISOString();
}

export interface AdminOverview {
  metrics: {
    policiesToday: number;
    revenueToday: number;
    openClaims: number;
    countriesCovered: number;
    visitorsYtd: number;
    claimsYtd: number;
    commissionLiabilityYtd: number;
  };
  policiesByCountry: { country: string; policies: number }[];
  agents: { code: string; name: string; org: string; status: string; policies: number; commission: number }[];
  recentClaims: { claimNumber: string; holder: string; type: string; amount: number | null; status: string; date: string }[];
  recentPolicies: { policyNumber: string; holder: string; country: string; premium: number; channel: string; status: string; date: string }[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const admin = getSupabaseAdmin();
  const today = startOfToday();
  const yearStart = startOfYear();

  const [
    { count: policiesToday },
    { data: revenueRows },
    { count: openClaims },
    { count: visitorsYtd },
    { count: claimsYtd },
    { data: commissionRows },
    { data: nationalityRows },
    { data: agentRows },
    { data: policyAgentRows },
    { data: commissionAgentRows },
    { data: claimRows },
    { data: policyRows },
  ] = await Promise.all([
    admin.from("policies").select("id", { count: "exact", head: true }).gte("created_at", today),
    admin.from("payments").select("amount").eq("status", "succeeded").gte("updated_at", today),
    admin.from("claims").select("id", { count: "exact", head: true }).in("status", OPEN_CLAIM_STATUSES),
    admin.from("policies").select("id", { count: "exact", head: true }).gte("created_at", yearStart),
    admin.from("claims").select("id", { count: "exact", head: true }).gte("created_at", yearStart),
    admin.from("commissions").select("amount").neq("status", "paid").gte("created_at", yearStart),
    admin.from("customers").select("nationality"),
    admin
      .from("agents")
      .select("id, agent_code, status, users(name), organizations(name)")
      .order("created_at", { ascending: false }),
    admin.from("policies").select("agent_id, premium").not("agent_id", "is", null),
    admin.from("commissions").select("agent_id, amount"),
    admin
      .from("claims")
      .select("claim_number, incident_type, status, approved_amount, created_at, policies(policy_number, customers(full_name))")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("policies")
      .select("policy_number, premium, channel, status, created_at, customers(full_name, nationality)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const revenueToday = (revenueRows ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const commissionLiabilityYtd = (commissionRows ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const countriesCovered = new Set((nationalityRows ?? []).map((r) => r.nationality)).size;

  const policiesByAgent = new Map<string, { count: number; premium: number }>();
  for (const row of policyAgentRows ?? []) {
    const key = row.agent_id as string;
    const cur = policiesByAgent.get(key) ?? { count: 0, premium: 0 };
    cur.count += 1;
    cur.premium += Number(row.premium);
    policiesByAgent.set(key, cur);
  }
  const commissionByAgent = new Map<string, number>();
  for (const row of commissionAgentRows ?? []) {
    const key = row.agent_id as string;
    commissionByAgent.set(key, (commissionByAgent.get(key) ?? 0) + Number(row.amount));
  }

  const agents = (agentRows ?? []).map((a) => {
    const user = Array.isArray(a.users) ? a.users[0] : a.users;
    const org = Array.isArray(a.organizations) ? a.organizations[0] : a.organizations;
    return {
      code: a.agent_code as string,
      name: (user?.name as string) ?? "—",
      org: (org?.name as string) ?? "—",
      status: a.status as string,
      policies: policiesByAgent.get(a.id as string)?.count ?? 0,
      commission: commissionByAgent.get(a.id as string) ?? 0,
    };
  });

  const countryTotals = new Map<string, number>();
  for (const row of nationalityRows ?? []) {
    countryTotals.set(row.nationality, (countryTotals.get(row.nationality) ?? 0) + 1);
  }
  const policiesByCountry = [...countryTotals.entries()]
    .map(([country, policies]) => ({ country, policies }))
    .sort((a, b) => b.policies - a.policies);

  const recentClaims = (claimRows ?? []).map((c) => {
    const policy = Array.isArray(c.policies) ? c.policies[0] : c.policies;
    const customer = policy ? (Array.isArray(policy.customers) ? policy.customers[0] : policy.customers) : null;
    return {
      claimNumber: c.claim_number as string,
      holder: (customer?.full_name as string) ?? "—",
      type: (c.incident_type as string) ?? "Unspecified",
      amount: c.approved_amount ? Number(c.approved_amount) : null,
      status: c.status as string,
      date: c.created_at as string,
    };
  });

  const recentPolicies = (policyRows ?? []).map((p) => {
    const customer = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    return {
      policyNumber: p.policy_number as string,
      holder: (customer?.full_name as string) ?? "—",
      country: (customer?.nationality as string) ?? "—",
      premium: Number(p.premium),
      channel: p.channel as string,
      status: p.status as string,
      date: p.created_at as string,
    };
  });

  return {
    metrics: {
      policiesToday: policiesToday ?? 0,
      revenueToday,
      openClaims: openClaims ?? 0,
      countriesCovered,
      visitorsYtd: visitorsYtd ?? 0,
      claimsYtd: claimsYtd ?? 0,
      commissionLiabilityYtd,
    },
    policiesByCountry,
    agents,
    recentClaims,
    recentPolicies,
  };
}
