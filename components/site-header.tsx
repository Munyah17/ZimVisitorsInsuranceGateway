"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#plans", label: "Coverage" },
  { href: "/verify", label: "Verify Policy" },
  { href: "/claims", label: "Claims" },
  { href: "/agent", label: "Agents" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900",
                pathname === item.href && "bg-safari-50 text-safari-800"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/portal">
            <Button variant="ghost" size="sm">
              My Policy
            </Button>
          </Link>
          <Link href="/quote">
            <Button variant="accent" size="sm" className="h-9 px-5">
              Get Insurance
            </Button>
          </Link>
        </div>

        <button
          className="grid size-10 place-items-center rounded-xl text-stone-700 hover:bg-stone-100 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-stone-200/60 bg-white px-4 pb-4 pt-2 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2 px-2">
            <Link href="/portal" className="flex-1" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full">
                My Policy
              </Button>
            </Link>
            <Link href="/quote" className="flex-1" onClick={() => setOpen(false)}>
              <Button variant="accent" className="w-full">
                Get Insurance
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
