/**
 * GET /api/admin/data — everything the admin dashboard pages need.
 * Requires an admin session; see lib/require-role.ts. Query logic lives
 * in lib/admin-overview.ts, shared with the Super Admin console's
 * Overview (/api/private/overview).
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-role";
import { isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { getAdminOverview } from "@/lib/admin-overview";

export async function GET(request: Request) {
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const identity = await requireAdmin(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const overview = await getAdminOverview();
  return NextResponse.json(overview);
}
