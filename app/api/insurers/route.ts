/**
 * GET /api/insurers — public list of real insurer organizations for the
 * "Select Insurer" field (signup/application and anywhere else an insurer
 * choice appears). Only id/name are exposed — license numbers and contact
 * details stay private. Motions Microinsurance always sorts first; the
 * business works most closely with them and it's the default selection.
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { DEFAULT_INSURER_ID } from "@/lib/insurers";

export async function GET() {
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ insurers: [] }, { status: 503 });

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("organizations")
    .select("id, name")
    .in("type", ["microinsurer", "partner_insurer"])
    .eq("status", "active")
    .order("name", { ascending: true });

  const insurers = (data ?? []) as { id: string; name: string }[];
  // Shortened for the public picker only — the full legal name stays on
  // certificates and elsewhere the organizations table is read directly.
  for (const i of insurers) {
    if (i.id === DEFAULT_INSURER_ID) i.name = "Motions";
  }
  insurers.sort((a, b) => {
    if (a.id === DEFAULT_INSURER_ID) return -1;
    if (b.id === DEFAULT_INSURER_ID) return 1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ insurers, defaultInsurerId: DEFAULT_INSURER_ID });
}
