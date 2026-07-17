import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-safari-700 to-safari-950 text-sunset-300 shadow-lg shadow-safari-900/30 transition-transform group-hover:scale-105">
        <ShieldCheck className="size-5" />
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            "block text-sm font-bold tracking-tight",
            light ? "text-white" : "text-stone-900"
          )}
        >
          Hola Amigo
        </span>
        <span
          className={cn(
            "block text-[10px] font-semibold uppercase tracking-[0.22em]",
            light ? "text-sunset-300" : "text-safari-600"
          )}
        >
          Travelmate
        </span>
      </span>
    </Link>
  );
}
