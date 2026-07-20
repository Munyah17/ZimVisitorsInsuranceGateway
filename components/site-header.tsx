"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, ArrowLeft, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Public site navigation only. Portal dashboards (client, agent, admin,
 * super admin) get a slim session header with a single Back to Site button;
 * the sidebar hamburger inside DashboardShell is the only toggle there.
 */
const NAV = [
  { href: "/", label: "Home" },
  { href: "/#plans", label: "Coverage" },
  { href: "/partners", label: "Partners" },
  { href: "/verify", label: "Verify Policy" },
  { href: "/claims", label: "Claims" },
];

const DASHBOARD_PREFIXES = ["/portal", "/agent", "/admin", "/super-admin"];

function isDashboardRoute(pathname: string) {
  return DASHBOARD_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const inDashboard = isDashboardRoute(pathname);

  // Close the drawer on route change and lock body scroll while open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Session header for dashboard portals: logo + Back to Site only.
  if (inDashboard) {
    return (
      <header className="sticky top-0 z-50 border-b border-stone-200/60 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Back to Site
            </Button>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-stone-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />

          {/* Desktop nav */}
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
            <Link href="/portals">
              <Button variant="ghost" size="sm">
                <LogIn className="size-4" />
                Login
              </Button>
            </Link>
            <Link href="/quote">
              <Button variant="accent" size="sm" className="h-9 px-5">
                Get Started Now!
              </Button>
            </Link>
          </div>

          {/* Mobile: clean bar with logo + hamburger only */}
          <button
            className="grid size-10 place-items-center rounded-xl text-stone-700 transition-colors hover:bg-stone-100 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/*
        Retractable mobile menu. Rendered OUTSIDE the header element:
        the header's backdrop-blur makes it the containing block for
        fixed children, which clipped the drawer and made it look
        transparent. As a sibling of the header it fills the viewport
        with a solid white panel.
      */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              key="backdrop"
              aria-label="Close menu"
              className="fixed inset-0 z-[70] bg-safari-950/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 right-0 z-[75] flex w-[300px] max-w-[85vw] flex-col bg-white shadow-2xl lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="flex h-16 items-center justify-between border-b border-stone-100 px-5">
                <span className="text-sm font-bold tracking-tight text-stone-900">Menu</span>
                <button
                  className="grid size-10 place-items-center rounded-xl text-stone-600 hover:bg-stone-100"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto bg-white px-3 py-4">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-safari-800"
                  >
                    {item.label}
                    <ArrowRight className="size-4 text-stone-300" />
                  </Link>
                ))}
                <Link
                  href="/portals"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-safari-800"
                >
                  Login / Signup
                  <LogIn className="size-4 text-stone-300" />
                </Link>
              </nav>

              <div className="border-t border-stone-100 bg-white p-4">
                <Link href="/quote" onClick={() => setOpen(false)}>
                  <Button variant="accent" size="lg" className="w-full">
                    Get Started Now!
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <p className="mt-3 text-center text-[11px] text-stone-400">
                  Cover issued in under 3 minutes
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
