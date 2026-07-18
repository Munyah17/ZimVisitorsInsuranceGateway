/**
 * Premium calculation engine (frontend simulation).
 *
 * Mirrors the `pricing_breakdown` JSON stored on the `quotes` table in
 * supabase/schema.sql. Supports individual and group trips: a group is
 * priced per traveller (each with their own age loading and the product
 * minimum premium), then statutory charges apply to the combined premium:
 *
 *   Premium      = sum of per-traveller premiums
 *   ZTA Levy     = 2% of premium   (Zimbabwe Tourism Authority)
 *   Stamp Duty   = 5% of premium
 *   Total Due    = premium + ZTA levy + stamp duty
 *
 * When the backend goes live this logic moves to a Supabase Edge Function
 * (POST /api/quote) so rates can change without redeploying the frontend.
 */

import type { ActivityId, InsuranceProduct } from "./mock-data";

export const ZTA_LEVY_RATE = 0.02;
export const STAMP_DUTY_RATE = 0.05;

export interface PricingBreakdown {
  days: number;
  dayRate: number;
  activityLoading: number;
  /** Number of travellers priced (1 for individual trips). */
  travellers: number;
  /** Combined risk premium for all travellers, after minimum premium rules. */
  premium: number;
  ztaLevy: number;
  stampDuty: number;
  total: number;
}

const ACTIVITY_LOADINGS: Record<ActivityId, number> = {
  general: 1.0,
  safari: 1.2,
  adventure: 1.4,
};

export function tripDays(arrival: string, departure: string): number {
  const a = new Date(arrival + "T00:00:00");
  const d = new Date(departure + "T00:00:00");
  const ms = d.getTime() - a.getTime();
  if (Number.isNaN(ms) || ms < 0) return 0;
  return Math.floor(ms / 86_400_000) + 1; // inclusive of both travel days
}

export function ageOn(dateOfBirth: string, onDate: string): number {
  const dob = new Date(dateOfBirth + "T00:00:00");
  const on = new Date(onDate + "T00:00:00");
  let age = on.getFullYear() - dob.getFullYear();
  const m = on.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < dob.getDate())) age--;
  return age;
}

function ageLoading(age: number): number {
  if (age >= 76) return 1.6;
  if (age >= 65) return 1.3;
  return 1.0;
}

export function calculatePremium(params: {
  product: InsuranceProduct;
  arrivalDate: string;
  departureDate: string;
  /** One date of birth per traveller (group leader first). */
  dateOfBirths: string[];
  activities: ActivityId[];
}): PricingBreakdown {
  const { product, arrivalDate, departureDate, dateOfBirths, activities } = params;

  const days = tripDays(arrivalDate, departureDate);
  const dayRate = product.baseRatePerDayUsd;

  // Highest-risk selected activity drives the loading (not cumulative).
  const activityLoading = activities.length
    ? Math.max(...activities.map((a) => ACTIVITY_LOADINGS[a]))
    : 1.0;

  const onDate = arrivalDate || new Date().toISOString().slice(0, 10);
  const dobs = dateOfBirths.length > 0 ? dateOfBirths : [""];

  let premium = 0;
  for (const dob of dobs) {
    const loadingForAge = dob ? ageLoading(ageOn(dob, onDate)) : 1.0;
    const risk = days * dayRate * activityLoading * loadingForAge;
    premium += Math.max(risk, product.minPremiumUsd);
  }
  premium = round2(premium);

  const ztaLevy = round2(premium * ZTA_LEVY_RATE);
  const stampDuty = round2(premium * STAMP_DUTY_RATE);
  const total = round2(premium + ztaLevy + stampDuty);

  return {
    days,
    dayRate,
    activityLoading,
    travellers: dobs.length,
    premium,
    ztaLevy,
    stampDuty,
    total,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Simulated sequential policy number, e.g. ZVIG-2026-01848 */
export function nextPolicyNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(1848 + Math.random() * 50)).padStart(5, "0");
  return `ZVIG-${year}-${seq}`;
}
