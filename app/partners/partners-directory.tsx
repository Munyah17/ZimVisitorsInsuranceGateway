"use client";

/**
 * Service Partners directory — the care network accepting Travelmate Zim
 * cover. Built to scale past 100 providers: searchable, filterable by
 * category, rendered from the shared partners data in lib/partners-data.ts
 * (also used by the quote wizard's "near you" panel).
 *
 * Live version: reads `organizations` (types hospital, ambulance_service,
 * emergency_assistance...) from Supabase; logos come from Storage and
 * replace the initials placeholder on each card.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Handshake,
  Hospital,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/motion";
import { CATEGORIES, CATEGORY_BADGE, PARTNERS, partnerInitials } from "@/lib/partners-data";
import { cn } from "@/lib/utils";

export function PartnersDirectory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");

  // Arriving from the quote wizard's "near you" panel pre-fills the city.
  // Read after mount rather than via useSearchParams(), which forces
  // Next.js to statically prerender this whole directory as an empty
  // placeholder with no partner cards until the JS bundle hydrates.
  useEffect(() => {
    const city = new URLSearchParams(window.location.search).get("city");
    if (city) setQuery(city);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PARTNERS.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q))
    );
  }, [query, category]);

  return (
    <div className="bg-gradient-to-b from-safari-50/60 to-transparent">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        {/* Header */}
        <FadeIn>
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-safari-950 text-sunset-300 shadow-lg">
              <Handshake className="size-7" />
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Service Partners
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-stone-500">
              Over 100 clinics, medical practices, ambulance services and
              emergency care providers across Zimbabwe accept your Travelmate
              Zim cover directly, with no upfront payment.
            </p>
          </div>
        </FadeIn>

        {/* Search + filters */}
        <FadeIn>
          <div className="mx-auto mt-10 max-w-3xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <Input
                placeholder="Search by name or city…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 pl-11"
                aria-label="Search service partners"
              />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                    category === c
                      ? "bg-safari-900 text-white shadow"
                      : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-stone-400">
              Showing {filtered.length} of {PARTNERS.length} listed partners.
              More join the network every month.
            </p>
          </div>
        </FadeIn>

        {/* Cards */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <div
              key={p.name}
              className="group flex flex-col rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-safari-300 hover:shadow-lg hover:shadow-safari-900/5"
            >
              {/* Logo placeholder: swapped for the provider's uploaded logo when live */}
              <div className="flex items-start justify-between">
                <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-safari-700 to-safari-950 text-lg font-bold text-sunset-300">
                  {partnerInitials(p.name)}
                </span>
                {p.open24h && (
                  <Badge variant="success">
                    <Clock className="size-3" /> 24/7
                  </Badge>
                )}
              </div>
              <h2 className="mt-4 font-bold leading-snug text-stone-900">{p.name}</h2>
              <Badge variant={CATEGORY_BADGE[p.category]} className="mt-2 w-fit">
                {p.category === "Ambulance Services" ? (
                  <Siren className="size-3" />
                ) : (
                  <Hospital className="size-3" />
                )}
                {p.category}
              </Badge>
              <div className="mt-4 flex-1 space-y-2 text-sm">
                <p className="flex items-center gap-2 text-stone-600">
                  <MapPin className="size-4 shrink-0 text-safari-500" />
                  {p.city}
                </p>
                <a
                  href={`tel:${p.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 font-medium text-stone-800 transition-colors hover:text-safari-700"
                >
                  <Phone className="size-4 shrink-0 text-safari-500" />
                  {p.phone}
                </a>
              </div>
              <p className="mt-4 flex items-center gap-1.5 border-t border-stone-100 pt-3 text-xs text-stone-400">
                <ShieldCheck className="size-3.5 text-safari-500" />
                Accepts Travelmate cover directly
              </p>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-12 text-center text-sm text-stone-500">
            No partners match your search. Try a different name, city or
            category.
          </p>
        )}
      </div>
    </div>
  );
}
