import { cn } from "@/lib/utils";

/**
 * A thin Zimbabwe-flag accent bar (green / gold / red / black). Used as a
 * restrained national touch — the site masthead, a frame under hero
 * landmark photography, and certificate headers — never as general UI
 * chrome, so the fintech-premium design language stays intact.
 */
export function ZimRibbon({ className }: { className?: string }) {
  return <div className={cn("zim-ribbon h-1.5 w-full", className)} aria-hidden />;
}
