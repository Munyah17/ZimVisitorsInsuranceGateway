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
import { PRODUCTS } from "@/lib/mock-data";
import { formatUSD } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Coverage",
  description: "Every Zim Travelmate package, in full detail — what's covered, the limits, and what it costs.",
};

const COVERAGE_ITEMS: {
  key: keyof (typeof PRODUCTS)[number]["coverage"];
  label: string;
  icon: typeof HeartPulse;
  describe: (product: (typeof PRODUCTS)[number]) => string;
}[] = [
  {
    key: "medicalLimitUsd",
    label: "Medical cover",
    icon: HeartPulse,
    describe: (p) => `Up to ${formatUSD(p.coverage.medicalLimitUsd)}`,
  },
  {
    key: "emergencyAssistance",
    label: "Emergency assistance",
    icon: Siren,
    describe: (p) => (p.coverage.emergencyAssistance ? "24/7 emergency response line" : "Not included"),
  },
  {
    key: "accidentCoverUsd",
    label: "Accident cover",
    icon: ShieldCheck,
    describe: (p) => `Up to ${formatUSD(p.coverage.accidentCoverUsd)}`,
  },
  {
    key: "travelProtection",
    label: "Travel protection",
    icon: PlaneTakeoff,
    describe: (p) => (p.coverage.travelProtection ? "Delays, disruption and lost documents" : "Not included"),
  },
  {
    key: "safariAssistance",
    label: "Safari assistance",
    icon: Mountain,
    describe: (p) => (p.coverage.safariAssistance ? "Support across the national parks network" : "Not included"),
  },
  {
    key: "adventureActivities",
    label: "Adventure activities",
    icon: Mountain,
    describe: (p) => (p.coverage.adventureActivities ? "Rafting, bungee, gorge swing and more" : "Not included on this plan"),
  },
  {
    key: "evacuation",
    label: "Emergency evacuation",
    icon: Ambulance,
    describe: (p) => (p.coverage.evacuation ? "Air and ground evacuation to the nearest suitable facility" : "Not included"),
  },
];

export default function CoveragePage() {
  return (
    <div className="bg-gradient-to-b from-safari-50/60 to-transparent">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-safari-950 text-sunset-300 shadow-lg">
            <ShieldCheck className="size-7" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Coverage
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-stone-500">
            Every package Zim Travelmate offers, in full — what&apos;s covered, the
            limits, and what it costs. Backed by a licensed Zimbabwean
            underwriter.
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {PRODUCTS.map((p) => (
            <Card key={p.id} className={p.popular ? "border-safari-700 ring-1 ring-safari-700" : undefined}>
              <CardContent className="p-7 sm:p-9">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-safari-600">
                      {p.tagline}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-stone-900">{p.name}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
                      {p.description}
                    </p>
                  </div>
                  {p.popular && (
                    <Badge variant="dark" className="bg-safari-900 px-4 py-1.5 text-sunset-300 shadow-md">
                      Most popular
                    </Badge>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-baseline gap-2 rounded-2xl bg-safari-950 px-6 py-5 text-white">
                  <span className="text-3xl font-bold tracking-tight">{formatUSD(p.basePriceUsd)}</span>
                  <span className="text-sm text-safari-200/70">
                    from · {formatUSD(p.baseRatePerDayUsd)}/day · {formatUSD(p.minPremiumUsd)} minimum premium
                  </span>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {COVERAGE_ITEMS.map((item) => {
                    const value = p.coverage[item.key];
                    const included = typeof value === "boolean" ? value : true;
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
