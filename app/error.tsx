"use client";

/**
 * Route error boundary. Any runtime error in a page renders this friendly
 * screen instead of a blank one.
 */

import { RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-safari-950 text-sunset-300">
          <ShieldCheck className="size-7" />
        </span>
        <h1 className="mt-5 text-xl font-bold text-stone-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          An unexpected error stopped this page from loading. Your policy and
          data are safe. Please try again.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>
            <RotateCcw className="size-4" /> Try again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go to homepage
          </Button>
        </div>
        <p className="mt-5 text-xs text-stone-400">
          Still stuck? WhatsApp us on +263 78 000 1111
        </p>
      </div>
    </div>
  );
}
