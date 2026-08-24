"use client";

/**
 * "Countries covered" detail — every country we could possibly cover
 * (lib/countries.ts, ~195), annotated with real policy counts where we
 * actually have them. Search-as-you-type since the full list is long.
 */

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";

export function CountriesModal({
  open,
  onClose,
  countries,
}: {
  open: boolean;
  onClose: () => void;
  countries: { country: string; policies: number }[];
}) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const counts = new Map(countries.map((c) => [c.country, c.policies]));
    const all = COUNTRIES.map((country) => ({ country, policies: counts.get(country) ?? 0 }));
    const q = query.trim().toLowerCase();
    const filtered = q ? all.filter((c) => c.country.toLowerCase().includes(q)) : all;
    return filtered.sort((a, b) => b.policies - a.policies || a.country.localeCompare(b.country));
  }, [countries, query]);

  const coveredCount = countries.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"
      />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Countries covered</h2>
            <p className="text-xs text-stone-400">{coveredCount} with policies, of {COUNTRIES.length} listed</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="border-b border-stone-100 px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries…"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm text-stone-900 outline-none focus:border-safari-400 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {rows.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-stone-400">No countries match &quot;{query}&quot;.</p>
          ) : (
            <ul>
              {rows.map((c) => (
                <li
                  key={c.country}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-stone-50"
                >
                  <span className={cn("truncate", c.policies > 0 ? "font-medium text-stone-900" : "text-stone-400")}>
                    {c.country}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                      c.policies > 0 ? "bg-safari-100 text-safari-800" : "text-stone-300"
                    )}
                  >
                    {c.policies > 0 ? c.policies : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
