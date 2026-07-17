/**
 * ZVIG premium calculation engine (frontend simulation).
 *
 * Mirrors the `pricing_breakdown` JSON stored on the `quotes` table in
 * supabase/schema.sql:
 *   { days, day_rate, activity_loading, age_loading, subtotal, levies }
 *
 * When the backend goes live this logic moves to a Supabase Edge Function
 * (POST /api/quote) so rates can change without redeploying the frontend.
 */

import type { ActivityId, InsuranceProduct } from "./mock-data";

export interface PricingBreakdown {
  days: number;
  dayRate: number;
  activityLoading: number;
  ageLoading: number;
  subtotal: number;
  levies: number;
  total: number;
  minPremiumApplied: boolean;
}

const ACTIVITY_LOADINGS: Record<ActivityId, number> = {
  general: 1.0,
  safari: 1.2,
  adventure: 1.4,
};

/** IPEC-style policyholder protection levy, applied on top of the risk premium. */
const LEVY_RATE = 0.05;

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
  dateOfBirth: string;
  activities: ActivityId[];
}): PricingBreakdown {
  const { product, arrivalDate, departureDate, dateOfBirth, activities } = params;

  const days = tripDays(arrivalDate, departureDate);
  const dayRate = product.baseRatePerDayUsd;

  // Highest-risk selected activity drives the loading (not cumulative).
  const activityLoading = activities.length
    ? Math.max(...activities.map((a) => ACTIVITY_LOADINGS[a]))
    : 1.0;

  const age = ageOn(dateOfBirth, arrivalDate || new Date().toISOString().slice(0, 10));
  const loadingForAge = dateOfBirth ? ageLoading(age) : 1.0;

  const risk = days * dayRate * activityLoading * loadingForAge;
  const minPremiumApplied = risk < product.minPremiumUsd;
  const subtotal = Math.max(risk, product.minPremiumUsd);
  const levies = round2(subtotal * LEVY_RATE);
  const total = round2(subtotal + levies);

  return {
    days,
    dayRate,
    activityLoading,
    ageLoading: loadingForAge,
    subtotal: round2(subtotal),
    levies,
    total,
    minPremiumApplied,
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
