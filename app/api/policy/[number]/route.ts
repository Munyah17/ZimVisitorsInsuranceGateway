/**
 * GET /api/policy/{number} — public policy verification, live against
 * Supabase. Used by /verify and by anything scanning a certificate QR
 * code. Returns only the fields safe to disclose publicly (no passport,
 * no contact details) — RLS on `policies`/`customers` enforces the same
 * boundary if this is ever called with the anon key directly.
 */

import { NextResponse } from "next/server";
import { fetchLivePolicy } from "@/lib/policy-lookup";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;

  let policy;
  try {
    policy = await fetchLivePolicy(decodeURIComponent(number));
  } catch (err) {
    console.error("Policy verification lookup failed", err);
    return NextResponse.json(
      { found: false, error: "Verification is temporarily unavailable." },
      { status: 503 }
    );
  }

  if (!policy) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({ found: true, policy });
}
