/**
 * GET /api/private/admin-data — real data for the Super Admin console's
 * platform-config sections (Users & Roles, Organizations, Audit Logs,
 * Payment gateways, System Health). Protected by the /private session
 * cookie, same as /api/private/overview. No fabricated numbers here — a
 * status is only shown if it was actually checked.
 */

import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/super-admin-session";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { isPaynowConfigured } from "@/lib/payment-gateways/paynow";
import { isWhatsAppConfigured } from "@/lib/whatsapp/client";

export async function GET(request: Request) {
  if (!verifySuperAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const admin = getSupabaseAdmin();

  const [{ data: userRows, error: usersError }, { data: orgRows }, { data: auditRows }] = await Promise.all([
    admin.from("users").select("name, email, role, created_at").order("created_at", { ascending: false }).limit(50),
    admin.from("organizations").select("name, type, license_number, status").order("created_at", { ascending: true }),
    admin
      .from("audit_logs")
      .select("action, entity, entity_id, created_at, users(name, email)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const users = (userRows ?? []).map((u) => ({
    name: u.name as string,
    email: u.email as string,
    role: u.role as string,
  }));

  const organizations = (orgRows ?? []).map((o) => ({
    name: o.name as string,
    type: (o.type as string).replace(/_/g, " "),
    license: (o.license_number as string) ?? "—",
    status: o.status as string,
  }));

  const auditLog = (auditRows ?? []).map((a) => {
    const actor = Array.isArray(a.users) ? a.users[0] : a.users;
    return {
      who: (actor?.name as string) ?? "system",
      what: `${a.action} · ${a.entity}${a.entity_id ? ` #${(a.entity_id as string).slice(0, 8)}` : ""}`,
      when: a.created_at as string,
    };
  });

  // Only Paynow has real integration code (lib/payment-gateways/paynow.ts).
  // No fabricated "Live"/"Sandbox" status for gateways nothing implements.
  const gateways = [
    { name: "Paynow", region: "Zimbabwe", status: isPaynowConfigured() ? "Live" : "Not configured" },
  ];

  const services = [
    { name: "Supabase database", ok: !usersError },
    { name: "Paynow payments", ok: isPaynowConfigured() },
    { name: "WhatsApp bot", ok: isWhatsAppConfigured() },
  ];

  return NextResponse.json({ users, organizations, auditLog, gateways, services });
}
