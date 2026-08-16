/**
 * Minimal signed session for the /private Super Admin console.
 *
 * /api/private/login sets an HttpOnly cookie after checking the password
 * (see that route). Every admin-only mutation route (e.g. service partner
 * writes) must call requireSuperAdmin() — without it, anyone who guesses
 * the route could write straight to the service-role client, bypassing the
 * /private gate entirely.
 *
 * Deliberately dependency-free (Node's built-in crypto): a token is
 * `expiry.hmac(expiry)`, signed with SUPER_ADMIN_PASSWORD so it's only
 * valid as long as that secret is. No server-side session store needed.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "zvig_super_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSessionToken(): string | null {
  const secret = process.env.SUPER_ADMIN_PASSWORD;
  if (!secret) return null;
  const expiry = String(Date.now() + SESSION_TTL_MS);
  return `${expiry}.${sign(expiry, secret)}`;
}

export function verifySuperAdmin(request: Request): boolean {
  const secret = process.env.SUPER_ADMIN_PASSWORD;
  if (!secret) return false;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return false;

  const token = decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
  const [expiry, signature] = token.split(".");
  if (!expiry || !signature) return false;
  if (Date.now() > Number(expiry)) return false;

  const expected = sign(expiry, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
