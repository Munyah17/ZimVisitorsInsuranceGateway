/**
 * POST /api/claims — real claim submission. Looks up the policy, uploads
 * every attached document/photo to the private `claims` Storage bucket,
 * and inserts a `claims` row (server side, service-role only — see RLS
 * notes in supabase/schema.sql). Multipart so real files travel with the
 * form instead of being faked client side.
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";

function generateClaimNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 8999);
  return `ZVIG-C-${year}-${seq}`;
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Claim submission is not available right now. Please contact support." },
      { status: 503 }
    );
  }

  const form = await request.formData();
  const policyNumber = String(form.get("policyNumber") ?? "").trim().toUpperCase();
  const incidentDate = String(form.get("incidentDate") ?? "");
  const location = String(form.get("location") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (!policyNumber || !incidentDate || !location || description.length < 10) {
    return NextResponse.json(
      { error: "Fill in your policy number, incident date, location and a description." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  const { data: policy, error: policyError } = await admin
    .from("policies")
    .select("id")
    .eq("policy_number", policyNumber)
    .maybeSingle();

  if (policyError || !policy) {
    return NextResponse.json(
      { error: "We couldn't find a policy with that number." },
      { status: 404 }
    );
  }

  const claimNumber = generateClaimNumber();
  const documents: { name: string; path: string }[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${claimNumber}/${Date.now()}-${safeName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from("claims")
      .upload(path, bytes, { contentType: file.type || "application/octet-stream" });
    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload ${file.name}: ${uploadError.message}` },
        { status: 500 }
      );
    }
    documents.push({ name: file.name, path });
  }

  const { error: insertError } = await admin.from("claims").insert({
    claim_number: claimNumber,
    policy_id: policy.id,
    incident_date: incidentDate,
    description,
    location,
    documents,
  });

  if (insertError) {
    return NextResponse.json({ error: "Could not submit your claim." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, claimNumber });
}
