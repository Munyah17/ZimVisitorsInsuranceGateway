/**
 * Server-side role check for admin/agent API routes. The client sends its
 * Supabase access token as a Bearer header (see lib/use-role-data.ts);
 * this verifies it and looks up the caller's role directly with the
 * service-role client — bypassing RLS is fine here since we're the ones
 * doing the authorization check, not skipping it.
 */

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface AdminIdentity {
  role: "admin";
  userId: string;
  name: string;
}

export interface AgentIdentity {
  role: "agent";
  userId: string;
  name: string;
  agentId: string;
  agentCode: string;
  commissionRate: number;
  orgName: string | null;
}

export async function requireAdmin(request: Request): Promise<AdminIdentity | null> {
  const userRow = await authenticatedUserRow(request);
  if (!userRow || userRow.role !== "admin") return null;
  return { role: "admin", userId: userRow.id, name: userRow.name };
}

export async function requireAgent(request: Request): Promise<AgentIdentity | null> {
  const userRow = await authenticatedUserRow(request);
  if (!userRow || userRow.role !== "agent") return null;

  const admin = getSupabaseAdmin();
  const { data: agentRow } = await admin
    .from("agents")
    .select("id, agent_code, commission_rate, organizations(name)")
    .eq("user_id", userRow.id)
    .maybeSingle();
  if (!agentRow) return null;

  const org = Array.isArray(agentRow.organizations) ? agentRow.organizations[0] : agentRow.organizations;

  return {
    role: "agent",
    userId: userRow.id,
    name: userRow.name,
    agentId: agentRow.id,
    agentCode: agentRow.agent_code,
    commissionRate: Number(agentRow.commission_rate),
    orgName: (org?.name as string) ?? null,
  };
}

async function authenticatedUserRow(request: Request): Promise<{ id: string; role: string; name: string } | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const admin = getSupabaseAdmin();
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return null;

  const { data: userRow } = await admin
    .from("users")
    .select("id, role, name")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  return userRow;
}
