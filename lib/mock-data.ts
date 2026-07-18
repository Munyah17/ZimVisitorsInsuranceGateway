/**
 * ZVIG mock data layer.
 *
 * Shapes mirror `supabase/schema.sql` one-to-one so this frontend can be
 * switched from mock data to live Supabase queries without reshaping
 * anything — see docs/INTEGRATION_BLUEPRINT.md.
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
    emergencyAssistance: boolean;
    accidentCoverUsd: number;
    travelProtection: boolean;
    safariAssistance: boolean;
    adventureActivities: boolean;
    evacuation: boolean;
  };
  features: string[];
  popular?: boolean;
  /** Shown on the landing page plan grid (Essential / Premium / Plus). */
  featured?: boolean;
}

export const PRODUCTS: InsuranceProduct[] = [
  {
    id: "aaaaaaa1-0000-0000-0000-000000000001",
    name: "Zimbabwe Visitor Essential",
    tagline: "Core protection for every visitor",
    description: "Core medical and emergency cover for visitors to Zimbabwe.",
    category: "medical",
    providerName: "Horizon Microinsurance Company",
    basePriceUsd: 10,
    baseRatePerDayUsd: 0.8,
    minPremiumUsd: 10,
    coverage: {
      medicalLimitUsd: 10000,
      emergencyAssistance: true,
      accidentCoverUsd: 2500,
      travelProtection: false,
      safariAssistance: false,
      adventureActivities: false,
      evacuation: false,
    },
    features: [
      "$10,000 medical cover",
      "24/7 emergency assistance",
      "$2,500 accident cover",
      "Instant digital certificate",
    ],
    featured: true,
  },
  {
    id: "aaaaaaa1-0000-0000-0000-000000000002",
    name: "Zimbabwe Visitor Premium",
    tagline: "Higher limits, total confidence",
    description: "Higher medical limits with travel protection and safari assistance.",
    category: "medical_plus_travel",
    providerName: "Horizon Microinsurance Company",
    basePriceUsd: 30,
    baseRatePerDayUsd: 1.5,
    minPremiumUsd: 30,
    coverage: {
      medicalLimitUsd: 30000,
      emergencyAssistance: true,
      accidentCoverUsd: 5000,
      travelProtection: true,
      safariAssistance: true,
      adventureActivities: false,
      evacuation: true,
    },
    features: [
      "$30,000 medical cover",
      "Travel protection & delays",
      "Safari assistance network",
      "Emergency medical evacuation",
      "$5,000 accident cover",
    ],
    popular: true,
    featured: true,
  },
  {
    id: "aaaaaaa1-0000-0000-0000-000000000003",
    name: "Zimbabwe Adventure Rider",
    tagline: "For thrill-seekers at the Falls",
    description: "Extension for high-risk activities: white-water rafting, bungee, gorge swing.",
    category: "adventure",
    providerName: "Savanna Specialty Insurers",
    basePriceUsd: 30,
    baseRatePerDayUsd: 3.0,
    minPremiumUsd: 30,
    coverage: {
      medicalLimitUsd: 50000,
      emergencyAssistance: true,
      accidentCoverUsd: 10000,
      travelProtection: false,
      safariAssistance: true,
      adventureActivities: true,
      evacuation: true,
    },
    features: [
      "$50,000 medical cover",
      "White-water rafting & bungee",
      "Gorge swing & abseiling",
      "Helicopter evacuation",
    ],
  },
  {
    id: "aaaaaaa1-0000-0000-0000-000000000004",
    name: "Zimbabwe Visitor Plus",
    tagline: "VIP protection, zero compromise",
    description: "Very high medical limits with trip cancellation, personal liability and VIP assistance.",
    category: "medical_plus_travel",
    providerName: "Horizon Microinsurance Company",
    basePriceUsd: 45,
    baseRatePerDayUsd: 2.75,
    minPremiumUsd: 45,
    coverage: {
      medicalLimitUsd: 75000,
      emergencyAssistance: true,
      accidentCoverUsd: 10000,
      travelProtection: true,
      safariAssistance: true,
      adventureActivities: false,
      evacuation: true,
    },
    features: [
      "$75,000 medical cover",
      "Trip cancellation cover",
      "Personal liability",
      "VIP assistance & priority support",
    ],
    featured: true,
  },
];

/** The three plans shown on the landing page (per the UI mockup). */
export const FEATURED_PRODUCTS = PRODUCTS.filter((p) => p.featured);

export interface MockPolicy {
  policyNumber: string;
  holderName: string;
  nationality: string;
  productName: string;
  coverageSummary: string;
  startDate: string;
  endDate: string;
  premium: number;
  status: PolicyStatus;
  emergencyPhone: string;
}

export const MOCK_POLICIES: MockPolicy[] = [
  {
    policyNumber: "ZVIG-2026-00001",
    holderName: "John Smith",
    nationality: "United Kingdom",
    productName: "Zimbabwe Visitor Premium",
    coverageSummary: "Medical + Emergency + Travel Protection",
    startDate: "2026-08-01",
    endDate: "2026-08-20",
    premium: 30,
    status: "active",
    emergencyPhone: "+263 78 000 1111",
  },
  {
    policyNumber: "ZVIG-2026-00002",
    holderName: "Anna Müller",
    nationality: "Germany",
    productName: "Zimbabwe Visitor Essential",
    coverageSummary: "Medical + Emergency",
    startDate: "2026-06-10",
    endDate: "2026-06-24",
    premium: 12,
    status: "expired",
    emergencyPhone: "+263 78 000 1111",
  },
];

export const MOCK_CUSTOMER = {
  fullName: "John Smith",
  firstName: "John",
  email: "john.smith@example.com",
  nationality: "United Kingdom",
  passportNumber: "P123•••789",
  policy: MOCK_POLICIES[0],
};

export interface AgentCustomer {
  name: string;
  country: string;
  product: string;
  premium: number;
  date: string;
  status: PolicyStatus;
}

export const MOCK_AGENT = {
  name: "Tendai Moyo",
  agentCode: "AGT-0001",
  organization: "Shearwater Adventures",
  commissionRate: 0.1,
  stats: {
    visitorsInsured: 96,
    policiesSold: 128,
    commissionEarned: 296,
    monthGrowthPct: 18,
  },
  recentCustomers: [
    { name: "John Smith", country: "United Kingdom", product: "Visitor Premium", premium: 30, date: "2026-07-16", status: "active" },
    { name: "Chloé Dubois", country: "France", product: "Adventure Rider", premium: 42, date: "2026-07-15", status: "active" },
    { name: "Marco Rossi", country: "Italy", product: "Visitor Essential", premium: 12, date: "2026-07-15", status: "active" },
    { name: "Sarah Johnson", country: "United States", product: "Visitor Premium", premium: 33, date: "2026-07-14", status: "pending_payment" },
    { name: "Yuki Tanaka", country: "Japan", product: "Visitor Essential", premium: 10, date: "2026-07-13", status: "active" },
  ] as AgentCustomer[],
};

export const MOCK_ADMIN = {
  metrics: {
    policiesToday: 256,
    countriesCovered: 63,
    revenueToday: 5980,
    openClaims: 32,
    activeVisitors: 1382,
    conversionRatePct: 34,
  },
  policiesByCountry: [
    { country: "United Kingdom", policies: 312 },
    { country: "United States", policies: 268 },
    { country: "Germany", policies: 197 },
    { country: "South Africa", policies: 174 },
    { country: "Australia", policies: 121 },
    { country: "France", policies: 98 },
    { country: "China", policies: 74 },
  ],
  agentPerformance: [
    { agent: "Tendai Moyo", org: "Shearwater Adventures", policies: 214, commission: 486 },
    { agent: "Rudo Ncube", org: "Victoria Falls Hotel", policies: 186, commission: 420 },
    { agent: "Blessing Dube", org: "Wild Horizons", policies: 143, commission: 322 },
    { agent: "Kudzai Marufu", org: "Hwange Safari Lodge", policies: 97, commission: 214 },
  ],
  recentClaims: [
    { claimNumber: "ZVIG-C-2026-0006", holder: "Chloé Dubois", type: "Medical", amount: 1840, status: "under_review" as ClaimStatus, date: "2026-07-16" },
    { claimNumber: "ZVIG-C-2026-0005", holder: "Marco Rossi", type: "Accident", amount: 620, status: "forwarded_to_underwriter" as ClaimStatus, date: "2026-07-14" },
    { claimNumber: "ZVIG-C-2026-0004", holder: "Sarah Johnson", type: "Medical", amount: 3120, status: "approved" as ClaimStatus, date: "2026-07-11" },
    { claimNumber: "ZVIG-C-2026-0003", holder: "Yuki Tanaka", type: "Travel", amount: 240, status: "paid" as ClaimStatus, date: "2026-07-08" },
  ],
  recentPolicies: [
    { policyNumber: "ZVIG-2026-01847", holder: "Emma Wilson", country: "Australia", premium: 25, channel: "Web" },
    { policyNumber: "ZVIG-2026-01846", holder: "Lars Eriksen", country: "Norway", premium: 47, channel: "WhatsApp" },
    { policyNumber: "ZVIG-2026-01845", holder: "Priya Patel", country: "India", premium: 10, channel: "Agent" },
    { policyNumber: "ZVIG-2026-01844", holder: "Tom Becker", country: "Germany", premium: 30, channel: "Web" },
  ],
};

export const NATIONALITIES = [
  "United Kingdom", "United States", "Germany", "France", "South Africa",
  "Australia", "Canada", "China", "Japan", "India", "Italy", "Netherlands",
  "Spain", "Brazil", "Nigeria", "Kenya", "Botswana", "Zambia", "Norway",
  "Sweden", "Switzerland", "United Arab Emirates", "Other",
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
  { id: "study", label: "Study" },
  { id: "transit", label: "Transit" },
];

/** Look up a mock policy for the public verification page. */
export function findPolicy(policyNumber: string): MockPolicy | undefined {
  const q = policyNumber.trim().toUpperCase();
  return MOCK_POLICIES.find((p) => p.policyNumber === q);
}
