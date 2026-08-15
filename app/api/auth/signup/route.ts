/**
 * POST /api/auth/signup — creates a Supabase Auth user and their `users`
 * row (role = customer). Runs server side with the service-role key because
 * `users` has no client-side insert policy (see supabase/schema.sql RLS
 * section) — only the row owner may later read/update it.
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Sign-up is not available right now. Please contact support." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name || !email || password.length < 8) {
    return NextResponse.json(
      { error: "Enter your name, a valid email and a password of at least 8 characters." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError || !created.user) {
    const alreadyExists = createError?.message?.toLowerCase().includes("already registered");
    return NextResponse.json(
      { error: alreadyExists ? "An account with that email already exists." : "Could not create your account." },
      { status: alreadyExists ? 409 : 500 }
    );
  }

  const { error: insertError } = await admin.from("users").insert({
    auth_user_id: created.user.id,
    name,
    email,
    role: "customer",
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Could not create your account." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
