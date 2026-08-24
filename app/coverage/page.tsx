import type { Metadata } from "next";
import Link from "next/link";
import {
  Ambulance,
  Check,
  HeartPulse,
  Mountain,
  PlaneTakeoff,
  ShieldCheck,
  Siren,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchActiveProducts } from "@/lib/live-products";
import type { InsuranceProduct } from "@/lib/catalog";
import { formatUSD } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Coverage",
  description: "Every Zim Travelmate package, in full detail — what's covered, the limits, and what it costs.",
};

export const dynamic = "force-dynamic";

/** "Up to $X[, extra]" when the benefit applies, otherwise a plain "not included" line. */
function amountLine(amount: number, extra?: string) {
  if (amount <= 0) return "Not included on this plan";
  return `Up to ${formatUSD(amount)}${extra ? `, ${extra}` : ""}`;
}

const COVERAGE_ITEMS: {
  key: keyof InsuranceProduct["coverage"];
  label: string;
  icon: typeof HeartPulse;
  describe: (product: InsuranceProduct) => string;
}[] = [
  {
    key: "medicalLimitUsd",
    label: "Medical",
    icon: HeartPulse,
    describe: (p) => amountLine(p.coverage.medicalLimitUsd),
  },
  {
    key: "accidentCoverUsd",
    label: "Personal Accident cover",
    icon: ShieldCheck,
    describe: (p) => amountLine(p.coverage.accidentCoverUsd),
  },
  {
    key: "safariAssistanceUsd",
    label: "Safari Assistance",
    icon: Mountain,
    describe: (p) => amountLine(p.coverage.safariAssistanceUsd, "with roadside assistance and Air rescue"),
  },
  {
    key: "emergencyEvacuationUsd",
    label: "Emergency Assistance and Evacuation",
    icon: Siren,
    describe: (p) => amountLine(p.coverage.emergencyEvacuationUsd),
  },
  {
    key: "travelProtectionUsd",
    label: "Travel Protection",
    icon: PlaneTakeoff,
    describe: (p) => amountLine(p.coverage.travelProtectionUsd),
  },
  {
    key: "funeralCoverUsd",
    label: "Funeral Cover",
    icon: Ambulance,
    describe: (p) =>
      p.coverage.funeralCoverUsd > 0
        ? `Covers cost of repatriation up to ${formatUSD(p.coverage.funeralCoverUsd)}`
        : "Not included on this plan",
  },
  {
    key: "adventureActivities",
    label: "Adventure activities",
    icon: Mountain,
    describe: (p) => (p.coverage.adventureActivities ? "Rafting, bungee, gorge swing and more" : "Not included on this plan"),
  },
];

export default async function CoveragePage() {
  const products = await fetchActiveProducts();

  return (
    <div className="bg-gradient-to-b from-safari-50/60 to-transparent">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="space-y-8">
          {products.map((p) => (
            <Card key={p.id} className={p.popular ? "border-safari-700 ring-1 ring-safari-700" : undefined}>
              <CardContent className="p-7 sm:p-9">
                {p.popular && (
                  <div className="flex justify-end">
                    <Badge variant="dark" className="bg-safari-900 px-4 py-1.5 text-sunset-300 shadow-md">
                      Most popular
                    </Badge>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-baseline gap-2 rounded-2xl bg-safari-950 px-6 py-5 text-white">
                  <span className="text-3xl font-bold tracking-tight">{formatUSD(p.basePriceUsd)}</span>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {COVERAGE_ITEMS.map((item) => {
                    const value = p.coverage[item.key];
                    const included = typeof value === "boolean" ? value : Number(value) > 0;
                    return (
                      <div
                        key={item.label}
                        className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/60 p-4"
                      >
                        <span
                          className={
                            included
                              ? "grid size-9 shrink-0 place-items-center rounded-lg bg-safari-950 text-sunset-300"
                              : "grid size-9 shrink-0 place-items-center rounded-lg bg-stone-200 text-stone-400"
                          }
                        >
                          <item.icon className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{item.label}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                            {item.describe(p)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-7 border-t border-stone-100 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    What&apos;s included
                  </p>
                  <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-stone-600">
                        <Check className="mt-0.5 size-4 shrink-0 text-safari-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-6">
                  <Link href={`/quote?product=${p.id}`}>
                    <Button size="lg">
                      <Wallet className="size-4" /> Get covered
                    </Button>
                  </Link>
                  <p className="text-xs text-stone-400">
                    Underwritten by a licensed Zimbabwean insurer. Issued in minutes, valid instantly.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
