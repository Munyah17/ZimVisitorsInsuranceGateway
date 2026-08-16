/**
 * PATCH/DELETE a single Service Partner. Protected by the /private session
 * cookie — see lib/super-admin-session.ts.
 */

import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/super-admin-session";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";

const CATEGORIES = [
  "Hospitals & Clinics",
  "Medical Practices",
  "Ambulance Services",
  "Emergency Care",
  "Pharmacies",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const update: Record<string, unknown> = {};

  if (typeof body?.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body?.category === "string" && CATEGORIES.includes(body.category)) update.category = body.category;
  if (typeof body?.city === "string" && body.city.trim()) update.city = body.city.trim();
  if (typeof body?.phone === "string" && body.phone.trim()) update.phone = body.phone.trim();
  if (typeof body?.open24h === "boolean") update.open_24h = body.open24h;
  if (typeof body?.active === "boolean") update.active = body.active;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("service_partners")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ partner: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { id } = await params;
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("service_partners").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
