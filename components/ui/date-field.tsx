"use client";

/**
 * Custom date picker — always displays/accepts DD-MM-YYYY regardless of
 * the visitor's browser/OS locale. Native <input type="date"> renders its
 * picker and typed value in whatever format the browser's locale uses
 * (mm/dd/yyyy for US-locale browsers), which this app's British-standard
 * date convention can't override. Underlying value is still a plain
 * ISO yyyy-mm-dd string, so it drops into existing form state unchanged.
 *
 * Two ways in: type the date directly (DD-MM-YYYY, tolerant of "/" and
 * spaces as separators), or open the picker. The picker drills down
 * years -> months -> days instead of only stepping one month at a time —
 * picking a date of birth decades back used to mean dozens of clicks.
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
  /** Year the picker opens to when there's no value yet — e.g. ~30 years back for a date of birth, so it doesn't open on today's year. */
  openToYear?: number;
}

type View = "days" | "months" | "years";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseISO(iso: string | undefined): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

/** Accepts DD-MM-YYYY, DD/MM/YYYY or "DD MM YYYY". Returns an ISO date or null. */
function parseTyped(text: string): string | null {
  const m = /^(\d{1,2})[-/\s](\d{1,2})[-/\s](\d{4})$/.exec(text.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;
  return toISO(year, month - 1, day);
}

function toISO(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function DateField({ id, value, onChange, min, placeholder = "DD-MM-YYYY", className, invalid, openToYear }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("days");
  const [typed, setTyped] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const parsed = parseISO(value);
  const minParsed = parseISO(min);
  const today = new Date();
  const fallbackYear = openToYear ?? today.getFullYear();

  const [viewYear, setViewYear] = useState(parsed?.year ?? minParsed?.year ?? fallbackYear);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? minParsed?.month ?? today.getMonth());
  const [decadeStart, setDecadeStart] = useState(
    Math.floor((parsed?.year ?? fallbackYear) / 12) * 12
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setTyped(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const openPicker = () => {
    setView("days");
    setViewYear(parsed?.year ?? minParsed?.year ?? fallbackYear);
    setViewMonth(parsed?.month ?? minParsed?.month ?? today.getMonth());
    setDecadeStart(Math.floor((parsed?.year ?? fallbackYear) / 12) * 12);
    setOpen(true);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday-first

  const isBeforeMin = (day: number) => {
    if (!minParsed) return false;
    const d = Date.UTC(viewYear, viewMonth, day);
    const m = Date.UTC(minParsed.year, minParsed.month, minParsed.day);
    return d < m;
  };

  const pickDay = (day: number) => {
    onChange(toISO(viewYear, viewMonth, day));
    setOpen(false);
    setTyped(null);
  };

  const pickMonth = (month: number) => {
    setViewMonth(month);
    setView("days");
  };

  const pickYear = (year: number) => {
    setViewYear(year);
    setView("months");
  };

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const handleTypedChange = (text: string) => {
    setTyped(text);
    const iso = parseTyped(text);
    if (iso) onChange(iso);
  };

  const commitTyped = () => {
    if (typed !== null && !parseTyped(typed)) setTyped(null);
  };

  const displayValue = typed !== null ? typed : value ? formatDate(value) : "";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex h-11 w-full items-center rounded-xl border bg-white pl-4 pr-2 text-sm shadow-sm transition-colors focus-within:outline-none focus-within:ring-2",
          invalid
            ? "border-red-400 focus-within:ring-red-400 focus-within:border-red-400"
            : "border-stone-300 focus-within:ring-safari-500 focus-within:border-safari-500"
        )}
      >
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          placeholder={placeholder}
          onChange={(e) => handleTypedChange(e.target.value)}
          onBlur={commitTyped}
          onFocus={() => setOpen(false)}
          className="h-full w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
        />
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          aria-label="Open calendar"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          <Calendar className="size-4" />
        </button>
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 w-72 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
          {view === "days" && (
            <>
              <div className="flex items-center justify-between px-1 pb-2">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                  className="grid size-7 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDecadeStart(Math.floor(viewYear / 12) * 12);
                    setView("years");
                  }}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-stone-900 hover:bg-stone-100"
                >
                  {MONTHS[viewMonth]} {viewYear}
                </button>
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
                      onClick={() => pickDay(day)}
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
            </>
          )}

          {view === "months" && (
            <>
              <div className="flex items-center justify-between px-1 pb-2">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y - 1)}
                  aria-label="Previous year"
                  className="grid size-7 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDecadeStart(Math.floor(viewYear / 12) * 12);
                    setView("years");
                  }}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-stone-900 hover:bg-stone-100"
                >
                  {viewYear}
                </button>
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y + 1)}
                  aria-label="Next year"
                  className="grid size-7 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS_SHORT.map((label, month) => {
                  const disabled = minParsed && viewYear === minParsed.year && month < minParsed.month;
                  const selected = parsed && parsed.year === viewYear && parsed.month === month;
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={Boolean(disabled)}
                      onClick={() => pickMonth(month)}
                      className={cn(
                        "rounded-lg py-2.5 text-xs font-medium transition-colors",
                        selected
                          ? "bg-safari-900 text-white"
                          : disabled
                            ? "cursor-not-allowed text-stone-300"
                            : "text-stone-700 hover:bg-safari-50"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {view === "years" && (
            <>
              <div className="flex items-center justify-between px-1 pb-2">
                <button
                  type="button"
                  onClick={() => setDecadeStart((d) => d - 12)}
                  aria-label="Previous years"
                  className="grid size-7 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-sm font-semibold text-stone-900">
                  {decadeStart} – {decadeStart + 11}
                </span>
                <button
                  type="button"
                  onClick={() => setDecadeStart((d) => d + 12)}
                  aria-label="Next years"
                  className="grid size-7 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 12 }).map((_, i) => {
                  const year = decadeStart + i;
                  const disabled = minParsed && year < minParsed.year;
                  const selected = parsed && parsed.year === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      disabled={Boolean(disabled)}
                      onClick={() => pickYear(year)}
                      className={cn(
                        "rounded-lg py-2.5 text-xs font-medium transition-colors",
                        selected
                          ? "bg-safari-900 text-white"
                          : disabled
                            ? "cursor-not-allowed text-stone-300"
                            : "text-stone-700 hover:bg-safari-50"
                      )}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
