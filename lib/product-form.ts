/** Shared by the admin product create/update routes. */

/** Horizon Microinsurance Company — same default underwriter checkout uses. */
export const DEFAULT_UNDERWRITER_ORG_ID = "22222222-2222-2222-2222-222222222222";

export const CATEGORIES = ["medical", "medical_plus_travel", "adventure", "transit"];

export function buildCoverageDetails(body: Record<string, unknown>) {
  return {
    medical_limit_usd: Number(body.medicalLimitUsd) || 0,
    emergency_assistance: Boolean(body.emergencyAssistance),
    accident_cover_usd: Number(body.accidentCoverUsd) || 0,
    travel_protection: Boolean(body.travelProtection),
    safari_assistance: Boolean(body.safariAssistance),
    adventure_activities: Boolean(body.adventureActivities),
    evacuation: Boolean(body.evacuation),
    funeral_cover_usd: Number(body.funeralCoverUsd) || 0,
    base_rate_per_day_usd: Number(body.baseRatePerDayUsd) || 0,
    min_premium_usd: Number(body.minPremiumUsd) || 0,
  };
}
