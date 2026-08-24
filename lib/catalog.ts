/**
 * Shared enums/types and static reference config (travel purposes, planned
 * activities) used across the product catalogue, quote engine and quote
 * wizard. Shapes mirror `supabase/schema.sql` one-to-one — see
 * docs/INTEGRATION_BLUEPRINT.md. No business records live here; every
 * product, policy and customer is fetched live from Supabase.
 */

export type ProductCategory = "medical" | "medical_plus_travel" | "adventure" | "transit";
export type TravelPurpose = "tourism" | "business" | "study" | "transit";
export type PolicyStatus = "pending_payment" | "active" | "expired" | "cancelled" | "suspended";
export type ClaimStatus =
  | "submitted"
  | "under_review"
  | "forwarded_to_underwriter"
  | "approved"
  | "rejected"
  | "paid"
  | "closed";

export interface InsuranceProduct {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: ProductCategory;
  providerName: string; // resolved internally — never shown as "choose an insurer"
  basePriceUsd: number;
  baseRatePerDayUsd: number;
  minPremiumUsd: number;
  coverage: {
    medicalLimitUsd: number;
    accidentCoverUsd: number;
    safariAssistanceUsd: number;
    emergencyEvacuationUsd: number;
    travelProtectionUsd: number;
    funeralCoverUsd: number;
    adventureActivities: boolean;
  };
  features: string[];
  popular?: boolean;
  /** Shown on the landing page plan grid. */
  featured?: boolean;
}

/**
 * Benefit names only, no dollar limits — used for short "what's included"
 * summaries (e.g. the landing page plan cards). Full amounts belong on
 * /coverage, not on a marketing summary.
 */
export const COVERAGE_BENEFITS: { key: keyof InsuranceProduct["coverage"]; label: string }[] = [
  { key: "medicalLimitUsd", label: "Medical cover" },
  { key: "accidentCoverUsd", label: "Personal accident cover" },
  { key: "safariAssistanceUsd", label: "Safari assistance" },
  { key: "emergencyEvacuationUsd", label: "Emergency assistance & evacuation" },
  { key: "travelProtectionUsd", label: "Travel protection" },
  { key: "funeralCoverUsd", label: "Funeral cover" },
  { key: "adventureActivities", label: "Adventure activities cover" },
];

export const ACTIVITIES = [
  { id: "general", label: "General Travel", hint: "Sightseeing, city visits, cultural tours" },
  { id: "safari", label: "Safari", hint: "Game drives, walking safaris, national parks" },
  { id: "adventure", label: "Adventure", hint: "Rafting, bungee, gorge swing, canoeing" },
] as const;

export type ActivityId = (typeof ACTIVITIES)[number]["id"];

export const TRAVEL_PURPOSES: { id: TravelPurpose; label: string }[] = [
  { id: "tourism", label: "Tourism" },
  { id: "business", label: "Business" },
  { id: "study", label: "Study / Education" },
  { id: "transit", label: "Transit" },
];
