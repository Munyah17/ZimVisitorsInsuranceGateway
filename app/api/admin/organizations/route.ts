/**
 * GET /api/admin/organizations — real `organizations` directory for the
 * Admin dashboard. Requires an admin session; see lib/require-role.ts.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-role";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const identity = await requireAdmin(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: orgRows } = await admin
    .from("organizations")
    .select("name, type, license_number, status")
    .order("created_at", { ascending: true });

  const organizations = (orgRows ?? []).map((o) => ({
    name: o.name as string,
    type: (o.type as string).replace(/_/g, " "),
    license: (o.license_number as string) ?? "—",
    status: o.status as string,
  }));

  const insurers = organizations.filter((o) => o.type === "microinsurer" || o.type === "partner insurer").length;
  const careNetwork = organizations.filter((o) => o.type === "hospital" || o.type === "ambulance service").length;
  const pending = organizations.filter((o) => o.status === "pending_approval").length;

  return NextResponse.json({ organizations, stats: { total: organizations.length, insurers, careNetwork, pending } });
}
