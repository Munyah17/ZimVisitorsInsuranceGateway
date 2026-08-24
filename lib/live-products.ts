/**
 * Live product catalogue — replaces the static PRODUCTS/FEATURED_PRODUCTS
 * arrays in lib/mock-data.ts. Same InsuranceProduct shape either way, so
 * calculatePremium() and every display component are unaffected; only
 * the source of the data changes. Managed from the Super Admin console
 * (/private -> Products & Pricing) via /api/admin/products.
 */

import { getSupabase } from "@/lib/supabase";
import type { InsuranceProduct, ProductCategory } from "@/lib/mock-data";

interface ProductRow {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string;
  coverage_details: Record<string, unknown> | null;
  features: string[] | null;
  base_price_usd: number | string;
  popular: boolean;
  featured: boolean;
  active: boolean;
}

export function mapDbProduct(row: ProductRow): InsuranceProduct {
  const coverage = row.coverage_details ?? {};
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    category: row.category as ProductCategory,
    // Deliberately generic — the real underwriter is never surfaced to customers.
    providerName: "Licensed Zimbabwean insurer",
    basePriceUsd: Number(row.base_price_usd),
    baseRatePerDayUsd: Number(coverage.base_rate_per_day_usd ?? 0),
    minPremiumUsd: Number(coverage.min_premium_usd ?? row.base_price_usd),
    coverage: {
      medicalLimitUsd: Number(coverage.medical_limit_usd ?? 0),
      accidentCoverUsd: Number(coverage.accident_cover_usd ?? 0),
      safariAssistanceUsd: Number(coverage.safari_assistance_usd ?? 0),
      emergencyEvacuationUsd: Number(coverage.emergency_evacuation_usd ?? 0),
      travelProtectionUsd: Number(coverage.travel_protection_usd ?? 0),
      funeralCoverUsd: Number(coverage.funeral_cover_usd ?? 0),
      adventureActivities: Boolean(coverage.adventure_activities),
    },
    features: row.features ?? [],
    popular: row.popular,
    featured: row.featured,
  };
}

const PRODUCT_COLUMNS =
  "id, name, tagline, description, category, coverage_details, features, base_price_usd, popular, featured, active";

/** Public — active products only (RLS: "public read active products"). */
export async function fetchActiveProducts(): Promise<InsuranceProduct[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("insurance_products")
    .select(PRODUCT_COLUMNS)
    .eq("active", true)
    .order("base_price_usd", { ascending: true });

  if (error || !data) return [];
  return (data as ProductRow[]).map(mapDbProduct);
}

/** Public — a single active product by id. */
export async function fetchActiveProduct(id: string): Promise<InsuranceProduct | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("insurance_products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return mapDbProduct(data as ProductRow);
}
