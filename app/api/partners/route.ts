/**
 * GET /api/partners — public, live Service Partners list (RLS: only
 * `active = true` rows are readable with the anon key). Backs the public
 * /partners directory and the quote wizard's "near you" panel.
 */

import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("service_partners")
      .select("id, name, category, city, phone, open_24h")
      .order("name");

    if (error) throw error;
    const partners = (data ?? []).map((p) => ({
      id: p.id as string,
      name: p.name as string,
      category: p.category as string,
      city: p.city as string,
      phone: p.phone as string,
      open24h: p.open_24h as boolean,
    }));
    return NextResponse.json({ partners });
  } catch (err) {
    console.error("Partners list failed", err);
    return NextResponse.json({ partners: [] }, { status: 503 });
  }
}
