/**
 * GET /api/private/overview — real business/operations stats for the
 * Super Admin console's Overview section. Protected by the /private
 * session cookie (lib/super-admin-session.ts), not a Supabase role — the
 * Super Admin account has no `users` row at all, it's the separate
 * env-var-gated owner console. Same underlying query as the regular
 * Admin dashboard (lib/admin-overview.ts).
 */

import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/super-admin-session";
import { isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { getAdminOverview } from "@/lib/admin-overview";

export async function GET(request: Request) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const overview = await getAdminOverview();
  return NextResponse.json(overview);
}
