"use client";

/**
 * Searchable "Select Insurer" field — reusable anywhere in the app an
 * insurer choice appears. Fetches the real list from GET /api/insurers,
 * which always sorts Motions Microinsurance first (see that route for
 * why). Always optional; callers decide what "no selection" means.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Insurer {
  id: string;
  name: string;
}

interface InsurerSelectProps {
  id?: string;
  value: string;
  onChange: (insurerId: string) => void;
  placeholder?: string;
  className?: string;
}

export function InsurerSelect({ id, value, onChange, placeholder = "Select Insurer", className }: InsurerSelectProps) {
  const [insurers, setInsurers] = useState<Insurer[] | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/insurers")
      .then((r) => r.json())
      .then((data) => setInsurers(data.insurers ?? []))
      .catch(() => setInsurers([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const filtered = (insurers ?? []).filter((i) =>
    i.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const selected = insurers?.find((i) => i.id === value);

  const pick = (insurerId: string) => {
    onChange(insurerId);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-stone-300 bg-white px-4 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safari-500 focus-visible:border-safari-500"
      >
        <span className={selected ? "truncate text-stone-900" : "truncate text-stone-400"}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-stone-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-stone-100 px-3.5 py-2.5">
            <Search className="size-4 shrink-0 text-stone-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search insurers…"
              className="w-full text-sm text-stone-900 outline-none placeholder:text-stone-400"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => pick("")}
                className="block w-full px-4 py-2 text-left text-sm text-stone-500 hover:bg-safari-50"
              >
                No preference
              </button>
            </li>
            {!insurers ? (
              <li className="px-4 py-3 text-sm text-stone-400">Loading…</li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-stone-400">No insurers match &quot;{query}&quot;.</li>
            ) : (
              filtered.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => pick(i.id)}
                    className={cn(
                      "block w-full px-4 py-2 text-left text-sm hover:bg-safari-50",
                      value === i.id ? "bg-safari-50 font-semibold text-safari-800" : "text-stone-700"
                    )}
                  >
                    {i.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
