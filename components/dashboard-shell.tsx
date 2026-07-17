"use client";

/**
 * Shared dashboard chrome for the Customer Portal, Agent Portal and
 * Admin Command Centre — dark navy sidebar per the UI mockup.
 */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Menu, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function DashboardShell({
  title,
  subtitle,
  nav,
  activeHref,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  activeHref?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = activeHref ?? pathname;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-stone-100/70">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-safari-950 pt-20 transition-transform lg:static lg:translate-x-0 lg:pt-6",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col px-4 pb-6">
          <div className="mb-6 hidden items-center gap-2 px-2 lg:flex">
            <span className="grid size-8 place-items-center rounded-lg bg-white/10 text-sunset-300">
              <ShieldCheck className="size-4" />
            </span>
            <span className="text-sm font-bold text-white">ZVIG</span>
          </div>
          <nav className="space-y-1">
            {nav.map((item) => {
              const isActive = active === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sunset-500 text-white shadow-lg shadow-sunset-500/25"
                      : "text-safari-200/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="size-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-auto px-2 text-[10px] leading-relaxed text-safari-200/40">
            Prototype — mock data only.
            <br />© 2026 ZVIG Multiple Agency
          </p>
        </div>
      </aside>

      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                className="grid size-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-700 lg:hidden"
                onClick={() => setOpen(!open)}
                aria-label="Toggle sidebar"
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
                {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
              </div>
            </div>
            {badge}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Stat tile — hero number pattern. */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        accent
          ? "border-safari-900 bg-safari-950 text-white"
          : "border-stone-200/80 bg-white shadow-sm"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            accent ? "text-safari-200/70" : "text-stone-400"
          )}
        >
          {label}
        </span>
        <Icon className={cn("size-4", accent ? "text-sunset-300" : "text-safari-500")} />
      </div>
      <p
        className={cn(
          "mt-3 text-3xl font-bold tracking-tight",
          accent ? "text-white" : "text-stone-900"
        )}
      >
        {value}
      </p>
      {hint && (
        <p className={cn("mt-1 text-xs", accent ? "text-safari-200/60" : "text-stone-400")}>
          {hint}
        </p>
      )}
    </div>
  );
}
