/**
 * Super Admin product/pricing management — GET (list all, incl.
 * inactive) and POST (create). Protected by the /private session cookie.
 */

import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/super-admin-session";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { CATEGORIES, DEFAULT_UNDERWRITER_ORG_ID, buildCoverageDetails } from "@/lib/product-form";

export async function GET(request: Request) {
  if (!verifySuperAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("insurance_products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

export async function POST(request: Request) {
  if (!verifySuperAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const category = typeof body?.category === "string" ? body.category : "";
  const basePriceUsd = Number(body?.basePriceUsd);

  if (!name || !CATEGORIES.includes(category) || !Number.isFinite(basePriceUsd)) {
    return NextResponse.json({ error: "Fill in name, category and base price." }, { status: 400 });
  }

  const features = Array.isArray(body?.features) ? body.features.filter((f: unknown) => typeof f === "string") : [];

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("insurance_products")
    .insert({
      name,
      tagline: typeof body?.tagline === "string" ? body.tagline.trim() : null,
      description: typeof body?.description === "string" ? body.description.trim() : null,
      category,
      provider_id: DEFAULT_UNDERWRITER_ORG_ID,
      coverage_details: buildCoverageDetails(body),
      features,
      base_price_usd: basePriceUsd,
      popular: Boolean(body?.popular),
      featured: body?.featured !== false,
      active: body?.active !== false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}
