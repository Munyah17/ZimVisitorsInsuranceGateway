"use client";

/**
 * Customer Portal — mock authenticated dashboard (John Smith).
 * Live version: Supabase Auth session -> `users` -> `customers` -> `policies`.
 */

import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  Siren,
  User,
  Download,
  Eye,
  ShieldCheck,
  Phone,
  HeartPulse,
  Ambulance,
  Hospital,
  Compass,
  CircleAlert,
  Headset,
  QrCode,
  Check,
} from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { MOCK_CUSTOMER, PRODUCTS } from "@/lib/mock-data";
import { formatDate, formatUSD } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "My Policies", href: "/portal", icon: FileText },
  { label: "Submit Claim", href: "/claims", icon: FilePlus2 },
  { label: "Emergency Help", href: "/portal#emergency", icon: Siren },
  { label: "Profile", href: "/portal", icon: User },
];

const EMERGENCY = [
  { icon: HeartPulse, label: "Medical Emergency" },
  { icon: Ambulance, label: "Ambulance Service" },
  { icon: Hospital, label: "Nearest Hospital" },
  { icon: Compass, label: "Travel Assistance" },
  { icon: CircleAlert, label: "Report Incident" },
  { icon: Headset, label: "Contact Support" },
];

export default function PortalPage() {
  const { policy } = MOCK_CUSTOMER;
  const product = PRODUCTS.find((p) => p.name === policy.productName);

  const today = new Date("2026-07-17");
  const end = new Date(policy.endDate + "T00:00:00");
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));

  return (
    <DashboardShell
      title={`Welcome back, ${MOCK_CUSTOMER.firstName}`}
      subtitle="Your Zimbabwe visitor insurance at a glance"
      nav={NAV}
      activeHref="/portal"
      badge={
        <Badge variant="success" className="px-3 py-1.5 text-sm">
          <Check className="size-3.5" /> STATUS: ACTIVE
        </Badge>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active policy card */}
        <FadeIn className="lg:col-span-2" y={16}>
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-safari-950 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-sunset-300">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-safari-200/60">
                    Active policy
                  </p>
                  <p className="font-mono text-lg font-bold text-white">{policy.policyNumber}</p>
                </div>
              </div>
              <Badge variant="success" className="bg-emerald-400/20 text-emerald-300">
                ACTIVE ✓
              </Badge>
            </div>
            <CardContent className="p-6">
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone-400">Plan</dt>
                  <dd className="mt-1 font-semibold text-stone-900">{policy.productName}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone-400">Valid</dt>
                  <dd className="mt-1 font-semibold text-stone-900">
                    {formatDate(policy.startDate)} — {formatDate(policy.endDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone-400">Premium paid</dt>
                  <dd className="mt-1 font-semibold text-stone-900">
                    {formatUSD(policy.premium)} USD
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone-400">Policyholder</dt>
                  <dd className="mt-1 font-semibold text-stone-900">{MOCK_CUSTOMER.fullName}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone-400">Nationality</dt>
                  <dd className="mt-1 font-semibold text-stone-900">{MOCK_CUSTOMER.nationality}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone-400">Coverage</dt>
                  <dd className="mt-1 font-semibold text-stone-900">{policy.coverageSummary}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-stone-100 pt-6">
                <Button onClick={() => window.print()}>
                  <Download className="size-4" /> Download Certificate
                </Button>
                <Button variant="outline">
                  <Eye className="size-4" /> View Coverage
                </Button>
                <a href="#emergency">
                  <Button variant="outline" className="border-red-200 text-red-700 hover:border-red-400 hover:bg-red-50 hover:text-red-800">
                    <Siren className="size-4" /> Emergency Assistance
                  </Button>
                </a>
                <Link href="/claims">
                  <Button variant="outline">
                    <FilePlus2 className="size-4" /> Submit Claim
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Days-left + QR */}
        <FadeIn y={16} delay={0.08}>
          <div className="grid gap-6">
            <StatTile
              accent
              label="Cover remaining"
              value={`${daysLeft} days`}
              hint={`Expires ${formatDate(policy.endDate)}`}
              icon={ShieldCheck}
            />
            <Card>
              <CardContent className="flex items-center gap-5 p-6">
                <span className="grid size-24 shrink-0 place-items-center rounded-xl border border-dashed border-stone-300">
                  <QrCode className="size-14 text-stone-800" />
                </span>
                <div>
                  <p className="font-semibold text-stone-900">Verification QR</p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-500">
                    Show this at borders, hotels or hospitals for instant policy
                    verification.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>
      </div>

      {/* Coverage details */}
      {product && (
        <FadeIn y={16}>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your coverage</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {product.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 rounded-xl bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700"
                  >
                    <Check className="size-4 shrink-0 text-safari-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Emergency assistance */}
      <FadeIn y={16}>
        <section id="emergency" className="mt-6 scroll-mt-24">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Emergency assistance</CardTitle>
              <CardDescription>We are here to help, 24 hours a day, 7 days a week.</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href={`tel:${policy.emergencyPhone.replace(/\s/g, "")}`}
                className="flex items-center justify-between gap-4 rounded-2xl bg-red-600 px-6 py-5 text-white shadow-lg shadow-red-600/25 transition-colors hover:bg-red-700"
              >
                <span className="flex items-center gap-4">
                  <span className="grid size-11 place-items-center rounded-full bg-white/15">
                    <Phone className="size-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-medium uppercase tracking-wider text-red-100">
                      Call emergency hotline
                    </span>
                    <span className="block text-xl font-bold tracking-tight sm:text-2xl">
                      {policy.emergencyPhone}
                    </span>
                  </span>
                </span>
                <span className="hidden text-xs text-red-100 sm:block">Available 24/7</span>
              </a>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {EMERGENCY.map((e) => (
                  <button
                    key={e.label}
                    className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-left text-sm font-semibold text-stone-800 transition-all hover:border-red-300 hover:bg-red-50"
                  >
                    <e.icon className="size-5 text-red-600" />
                    {e.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </FadeIn>
    </DashboardShell>
  );
}
