"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** e.g. "Same as nationality" — an extra option at the top that clears the value. */
  emptyLabel?: string;
  className?: string;
}

export function CountrySelect({
  id,
  value,
  onChange,
  placeholder = "Select country",
  emptyLabel,
  className,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

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

  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(query.trim().toLowerCase())
  );

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-stone-300 bg-white px-4 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safari-500 focus-visible:border-safari-500",
          value ? "text-stone-900" : "text-stone-400"
        )}
      >
        <span className="truncate">{value || placeholder}</span>
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
              placeholder="Search countries…"
              className="w-full text-sm text-stone-900 outline-none placeholder:text-stone-400"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {emptyLabel && (
              <li>
                <button
                  type="button"
                  onClick={() => pick("")}
                  className="block w-full px-4 py-2 text-left text-sm text-stone-500 hover:bg-safari-50"
                >
                  {emptyLabel}
                </button>
              </li>
            )}
            {filtered.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => pick(c)}
                  className={cn(
                    "block w-full px-4 py-2 text-left text-sm hover:bg-safari-50",
                    value === c ? "bg-safari-50 font-semibold text-safari-800" : "text-stone-700"
                  )}
                >
                  {c}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-stone-400">No countries match &quot;{query}&quot;.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
