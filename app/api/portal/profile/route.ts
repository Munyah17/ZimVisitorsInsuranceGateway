/**
 * PATCH /api/portal/profile — updates the logged-in customer's own account
 * details on `users`. Email is intentionally not editable here (it is the
 * Supabase Auth login identity); nationality/passport are shown from the
 * latest `customers` record instead, since those are captured per-trip at
 * checkout, not something the account holder edits directly.
 */

import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/require-role";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";

export async function PATCH(request: Request) {
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const identity = await requireCustomer(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body.phone === "string") update.phone = body.phone.trim() || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("users").update(update).eq("id", identity.userId);
  if (error) return NextResponse.json({ error: "Could not save your changes." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
