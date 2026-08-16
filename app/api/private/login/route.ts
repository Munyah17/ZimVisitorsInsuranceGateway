/**
 * POST /api/private/login — credential check for the /private Super Admin
 * gate. The password never ships to the browser: it's compared server side
 * against SUPER_ADMIN_PASSWORD (set in .env.local and in Vercel project
 * env vars — never committed, this repo is public). On success, sets a
 * signed HttpOnly session cookie (lib/super-admin-session.ts) that admin
 * mutation routes require — otherwise those routes would be reachable by
 * anyone who found the URL, bypassing this gate entirely.
 */

import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/super-admin-session";

export async function POST(req: Request) {
  const username = process.env.SUPER_ADMIN_USERNAME;
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!username || !email || !password) {
    return NextResponse.json(
      {
        error:
          "Super Admin login is not configured. Set SUPER_ADMIN_USERNAME, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD.",
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const inputUsername = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const inputPassword = typeof body?.password === "string" ? body.password : "";

  const usernameOk =
    inputUsername === username.toLowerCase() || inputUsername === email.toLowerCase();

  if (usernameOk && inputPassword === password) {
    const token = createSessionToken();
    const res = NextResponse.json({ ok: true });
    if (token) {
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12,
      });
    }
    return res;
  }

  return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
}
