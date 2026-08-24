/**
 * PATCH a product's fields (name, tagline, pricing, coverage, features,
 * popular/featured/active). No DELETE here deliberately — policies and
 * quotes reference products by id (NOT NULL FK), so a hard delete could
 * break historical records; deactivating (active=false) is the safe
 * equivalent and is what this UI offers.
 */

import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/super-admin-session";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { CATEGORIES, buildCoverageDetails } from "@/lib/product-form";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifySuperAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body.tagline === "string") update.tagline = body.tagline.trim() || null;
  if (typeof body.description === "string") update.description = body.description.trim() || null;
  if (typeof body.category === "string" && CATEGORIES.includes(body.category)) update.category = body.category;
  if (Number.isFinite(Number(body.basePriceUsd))) update.base_price_usd = Number(body.basePriceUsd);
  if (Array.isArray(body.features)) update.features = body.features.filter((f: unknown) => typeof f === "string");
  if (typeof body.popular === "boolean") update.popular = body.popular;
  if (typeof body.featured === "boolean") update.featured = body.featured;
  if (typeof body.active === "boolean") update.active = body.active;

  // Coverage fields all live inside one jsonb column — if any were sent, rebuild the whole object.
  const coverageFields = [
    "medicalLimitUsd",
    "accidentCoverUsd",
    "safariAssistanceUsd",
    "emergencyEvacuationUsd",
    "travelProtectionUsd",
    "funeralCoverUsd",
    "adventureActivities",
    "baseRatePerDayUsd",
    "minPremiumUsd",
  ];
  if (coverageFields.some((f) => f in body)) {
    update.coverage_details = buildCoverageDetails(body);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("insurance_products")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}
