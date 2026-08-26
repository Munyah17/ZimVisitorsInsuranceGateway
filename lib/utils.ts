import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Leading part of an ISO date — matches both "2026-08-24" and "2026-08-24T14:33:00Z". */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * THE date formatter for this app: DD-MM-YYYY, e.g. 24-08-2026. Site-wide,
 * every surface, no exceptions — web pages, dashboards, PDF certificates,
 * WhatsApp messages.
 *
 * Never use `toLocaleDateString()`/`Intl.DateTimeFormat` for dates: with no
 * locale argument they follow the *device's* locale, so the same page renders
 * 08-24-2026 on a US-configured phone and 24-08-2026 on a British one. This
 * reorders the ISO string's own digits instead, so the output is identical on
 * every device, in every timezone, on server and client alike. (An ESLint rule
 * in eslint.config.mjs blocks the locale formatters so this can't regress.)
 *
 * Accepts a plain ISO date, a full ISO timestamp (the time part is ignored —
 * the UTC calendar day is used), or a Date. Returns "" for anything unparseable
 * rather than a broken "NaN-NaN-NaN".
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}-${value.getFullYear()}`;
  }
  const m = value ? ISO_DATE.exec(value) : null;
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

/** "Aug 2026" — for month-grouped chart labels, where a day would be meaningless. */
export function formatMonthYear(value: string | Date | null | undefined): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return `${MONTHS_SHORT[value.getMonth()]} ${value.getFullYear()}`;
  }
  const m = value ? ISO_DATE.exec(value) : null;
  return m ? `${MONTHS_SHORT[Number(m[2]) - 1]} ${m[1]}` : "";
}

/**
 * Parses what a person typed as DD-MM-YYYY into an ISO date, or null if it
 * isn't a real date. The counterpart to formatDate: the app only ever *reads*
 * day-first, so it only ever *accepts* day-first. Tolerant of "/", "." and
 * spaces as separators, and of unpadded days/months ("1-5-1990").
 */
export function parseDMY(text: string): string | null {
  const m = /^(\d{1,2})[-/.\s](\d{1,2})[-/.\s](\d{4})$/.exec(text.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > new Date(year, month, 0).getDate()) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "5 min ago", "3 h ago", "2 d ago" — computed from a real timestamp, never fabricated. */
export function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(iso);
}
