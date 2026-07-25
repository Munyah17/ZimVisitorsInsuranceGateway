/**
 * Server-only Supabase client using the SERVICE ROLE key.
 *
 * This bypasses Row Level Security, so it must NEVER be imported from a
 * "use client" component and must NEVER be exposed to the browser — only
 * from Route Handlers (app/api/**\/route.ts) and other server-only code.
 *
 * Used for the privileged writes real payments require: creating pending
 * policies before checkout, and activating them once Paynow confirms
 * payment. Requires SUPABASE_SERVICE_ROLE_KEY (Supabase project -> Settings
 * -> API -> service_role key) in addition to NEXT_PUBLIC_SUPABASE_URL.
 *
 * Every caller should check isSupabaseAdminConfigured() first and fail
 * with a clear error rather than silently pretending a write succeeded.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only env vars, never NEXT_PUBLIC_)."
    );
  }
  client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
