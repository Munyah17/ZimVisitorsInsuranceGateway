/**
 * PATCH /api/private/users — change a user's role. Protected by the
 * /private session cookie. There is no `super_admin` row in `users` at
 * all (see lib/super-admin-session.ts), so the assignable roles are
 * exactly the real `user_role` enum values.
 */

import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/super-admin-session";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";

const ROLES = ["customer", "agent", "admin", "underwriter_staff", "support"];

export async function PATCH(request: Request) {
  if (!verifySuperAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body?.role === "string" ? body.role : "";

  if (!email || !ROLES.includes(role)) {
    return NextResponse.json({ error: "Provide a valid email and role." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("users")
    .update({ role })
    .ilike("email", email)
    .select("name, email, role")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Could not update the role." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No account with that email." }, { status: 404 });

  return NextResponse.json({ user: data });
}
