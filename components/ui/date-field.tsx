"use client";

/**
 * Custom date picker — always displays DD-MM-YYYY regardless of the
 * visitor's browser/OS locale. Native <input type="date"> renders its
 * picker and typed value in whatever format the browser's locale uses
 * (mm/dd/yyyy for US-locale browsers), which this app's British-standard
 * date convention can't override. Underlying value is still a plain
 * ISO yyyy-mm-dd string, so it drops into existing form state unchanged.
 */

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface DateFieldProps {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseISO(iso: string | undefined): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

function toISO(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function DateField({ id, value, onChange, min, placeholder = "DD-MM-YYYY", className, invalid }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const parsed = parseISO(value);
  const minParsed = parseISO(min);
  const today = new Date();

  const [viewYear, setViewYear] = useState(parsed?.year ?? minParsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? minParsed?.month ?? today.getMonth());

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setViewYear(parsed?.year ?? minParsed?.year ?? today.getFullYear());
      setViewMonth(parsed?.month ?? minParsed?.month ?? today.getMonth());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday-first

  const isBeforeMin = (day: number) => {
    if (!minParsed) return false;
    const d = Date.UTC(viewYear, viewMonth, day);
    const m = Date.UTC(minParsed.year, minParsed.month, minParsed.day);
    return d < m;
  };

  const pick = (day: number) => {
    onChange(toISO(viewYear, viewMonth, day));
    setOpen(false);
  };

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border bg-white px-4 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2",
          invalid
            ? "border-red-400 focus-visible:ring-red-400 focus-visible:border-red-400"
            : "border-stone-300 focus-visible:ring-safari-500 focus-visible:border-safari-500"
        )}
      >
        <span className={value ? "text-stone-900" : "text-stone-400"}>
          {value ? formatDate(value) : placeholder}
        </span>
        <Calendar className="size-4 shrink-0 text-stone-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-72 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between px-1 pb-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="grid size-7 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold text-stone-900">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="grid size-7 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-stone-400">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isBeforeMin(day);
              const selected =
                parsed && parsed.year === viewYear && parsed.month === viewMonth && parsed.day === day;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(day)}
                  className={cn(
                    "h-8 rounded-lg text-xs transition-colors",
                    selected
                      ? "bg-safari-900 font-semibold text-white"
                      : disabled
                        ? "cursor-not-allowed text-stone-300"
                        : "text-stone-700 hover:bg-safari-50"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
