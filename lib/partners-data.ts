/**
 * Shared Service Partners data — clinics, medical practices, ambulance
 * services and emergency care providers accepting Travelmate Zim cover.
 * Used by the public /partners directory AND the quote wizard's
 * "service providers near you" panel, so a traveller who picks a
 * destination sees the relevant network immediately.
 *
 * Live version: reads `organizations` (types hospital, ambulance_service,
 * emergency_assistance...) from Supabase, city-matched to `travel_details`.
 */

export const CATEGORIES = [
  "All",
  "Hospitals & Clinics",
  "Medical Practices",
  "Ambulance Services",
  "Emergency Care",
  "Pharmacies",
] as const;

export type Category = Exclude<(typeof CATEGORIES)[number], "All">;

export interface Partner {
  name: string;
  category: Category;
  city: string;
  phone: string;
  open24h?: boolean;
}

export const PARTNERS: Partner[] = [
  // Hospitals & clinics
  { name: "Victoria Falls Private Hospital", category: "Hospitals & Clinics", city: "Victoria Falls", phone: "+263 83 284 4764", open24h: true },
  { name: "Avenues Clinic", category: "Hospitals & Clinics", city: "Harare", phone: "+263 24 251 0666", open24h: true },
  { name: "Mater Dei Hospital", category: "Hospitals & Clinics", city: "Bulawayo", phone: "+263 29 224 0000", open24h: true },
  { name: "West End Hospital", category: "Hospitals & Clinics", city: "Harare", phone: "+263 24 279 1500", open24h: true },
  { name: "Manica Medical Centre", category: "Hospitals & Clinics", city: "Mutare", phone: "+263 20 606 4420" },
  { name: "Hwange Medical Clinic", category: "Hospitals & Clinics", city: "Hwange", phone: "+263 81 382 2110" },
  { name: "Kariba Heights Clinic", category: "Hospitals & Clinics", city: "Kariba", phone: "+263 61 214 6330" },
  { name: "Great Zimbabwe Medical Centre", category: "Hospitals & Clinics", city: "Masvingo", phone: "+263 39 226 2210" },
  // Medical practices
  { name: "Falls Medical Practice", category: "Medical Practices", city: "Victoria Falls", phone: "+263 83 284 2077" },
  { name: "Baines Medical Group", category: "Medical Practices", city: "Harare", phone: "+263 24 270 5011" },
  { name: "Matobo Family Practice", category: "Medical Practices", city: "Bulawayo", phone: "+263 29 226 3350" },
  { name: "Great Zimbabwe Medical Rooms", category: "Medical Practices", city: "Masvingo", phone: "+263 39 226 4180" },
  // Ambulance services
  { name: "MARS Ambulance Zimbabwe", category: "Ambulance Services", city: "Nationwide", phone: "+263 24 277 1221", open24h: true },
  { name: "EMRAS Emergency Medical", category: "Ambulance Services", city: "Harare", phone: "+263 24 279 7478", open24h: true },
  { name: "Falls Rescue Response", category: "Ambulance Services", city: "Victoria Falls", phone: "+263 83 284 6119", open24h: true },
  // Emergency care
  { name: "ACE Air & Ambulance", category: "Emergency Care", city: "Nationwide", phone: "+263 78 004 4747", open24h: true },
  { name: "Health International Emergency", category: "Emergency Care", city: "Harare", phone: "+263 24 270 4674", open24h: true },
  { name: "SkyMed Evacuation", category: "Emergency Care", city: "Nationwide", phone: "+263 77 216 0160", open24h: true },
  // Pharmacies
  { name: "Greenwood Pharmacy", category: "Pharmacies", city: "Harare", phone: "+263 24 270 0355" },
  { name: "QV Pharmacy", category: "Pharmacies", city: "Bulawayo", phone: "+263 29 226 0344" },
  { name: "Falls Pharmacy", category: "Pharmacies", city: "Victoria Falls", phone: "+263 83 284 3529" },
];

export const CATEGORY_BADGE: Record<
  Category,
  "default" | "info" | "destructive" | "warning" | "success"
> = {
  "Hospitals & Clinics": "default",
  "Medical Practices": "info",
  "Ambulance Services": "destructive",
  "Emergency Care": "warning",
  Pharmacies: "success",
};

export function partnerInitials(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

/** Destinations offered in the quote wizard — values match Partner.city. */
export const DESTINATIONS = [
  { value: "Victoria Falls", label: "Victoria Falls" },
  { value: "Harare", label: "Harare" },
  { value: "Bulawayo", label: "Bulawayo" },
  { value: "Hwange", label: "Hwange National Park" },
  { value: "Kariba", label: "Kariba" },
  { value: "Masvingo", label: "Great Zimbabwe (Masvingo)" },
  { value: "Mutare", label: "Mutare / Eastern Highlands" },
  { value: "Multiple", label: "Multiple destinations" },
];

/**
 * Partners near a chosen destination: exact city match plus providers
 * marked "Nationwide", so a Victoria Falls visitor also sees the national
 * air ambulance and emergency lines. Emergency-relevant categories first.
 */
export function partnersNear(city: string, limit = 4): Partner[] {
  const priority: Record<Category, number> = {
    "Ambulance Services": 0,
    "Emergency Care": 1,
    "Hospitals & Clinics": 2,
    "Medical Practices": 3,
    Pharmacies: 4,
  };
  return PARTNERS
    .filter((p) => p.city === city || p.city === "Nationwide")
    .sort((a, b) => priority[a.category] - priority[b.category])
    .slice(0, limit);
}
