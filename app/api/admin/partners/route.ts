/**
 * Super Admin Service Partners management — GET (list, including inactive)
 * and POST (create). Protected by the /private session cookie; see
 * lib/super-admin-session.ts for why this can't just trust the client.
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

export async function GET(request: Request) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("service_partners")
    .select("id, name, category, city, phone, open_24h, active, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ partners: data ?? [] });
}

export async function POST(request: Request) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const category = typeof body?.category === "string" ? body.category : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const open24h = Boolean(body?.open24h);

  if (!name || !CATEGORIES.includes(category) || !city || !phone) {
    return NextResponse.json({ error: "Fill in name, category, city and phone." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("service_partners")
    .insert({ name, category, city, phone, open_24h: open24h })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ partner: data });
}
