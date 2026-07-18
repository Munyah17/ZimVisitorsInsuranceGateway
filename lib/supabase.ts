/**
 * Supabase client — prepared but NOT yet used by the prototype.
 *
 * The frontend currently runs on lib/mock-data.ts only. When the backend
 * (supabase/schema.sql) is deployed, screens switch to this client:
 *
 *   import { getSupabase } from "@/lib/supabase";
 *   const supabase = getSupabase();
 *   const { data } = await supabase
 *     .from("insurance_products")
 *     .select("*")
 *     .eq("active", true);
 *
 * Env vars (set in .env.local and in Vercel project settings):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * The anon key is safe to expose because Row Level Security in
 * supabase/schema.sql denies everything except the public product catalogue
 * and policy verification. Privileged writes (policy issuance, payments,
 * claims transitions) happen server-side with the service-role key inside
 * Next.js API routes / Supabase Edge Functions — never in the browser.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Copy .env.local.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  client = createClient(url, anonKey);
  return client;
}
