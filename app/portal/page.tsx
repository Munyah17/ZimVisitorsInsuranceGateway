"use client";

/**
 * Client Portal — Dashboard. Account-level stats plus the active policy.
 * Live version: Supabase Auth session -> `users` -> `customers` -> `policies`.
 */

import Link from "next/link";
import {
  FilePlus2,
  Siren,
  Download,
  Eye,
  ShieldCheck,
  QrCode,
  Check,
  CalendarDays,
  FileText,
  Plane,
} from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { MOCK_CUSTOMER, MOCK_POLICIES, PRODUCTS } from "@/lib/mock-data";
import { CLIENT_NAV } from "./nav";
import { formatDate, formatUSD } from "@/lib/utils";

export default function PortalPage() {
  const { policy } = MOCK_CUSTOMER;
  const product = PRODUCTS.find((p) => p.name === policy.productName);

  const today = new Date("2026-07-17");
  const end = new Date(policy.endDate + "T00:00:00");
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));
  const activeCount = MOCK_POLICIES.filter((p) => p.status === "active").length;

  return (
    <DashboardShell
      title={`Welcome back, ${MOCK_CUSTOMER.firstName}`}
      subtitle="Your Zimbabwe visitor insurance at a glance"
      nav={CLIENT_NAV}
      badge={
        <Badge variant="success" className="px-3 py-1.5 text-sm">
          <Check className="size-3.5" /> STATUS: ACTIVE
        </Badge>
      }
    >
      {/* Client-level stats */}
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            accent
            label="Cover remaining"
            value={`${daysLeft} days`}
            hint={`Expires ${formatDate(policy.endDate)}`}
            icon={ShieldCheck}
          />
          <StatTile
            label="Active policies"
            value={String(activeCount)}
            hint={`${MOCK_POLICIES.length} total on your account`}
            icon={FileText}
          />
          <StatTile label="Open claims" value="1" hint="1 under review" icon={FilePlus2} />
          <StatTile
            label="Trips insured"
            value={String(MOCK_POLICIES.length)}
            hint="Since you joined"
            icon={Plane}
          />
        </div>
      </FadeIn>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
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
                    {formatDate(policy.startDate)} to {formatDate(policy.endDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone-400">Premium paid</dt>
                  <dd className="mt-1 font-semibold text-stone-900">
                    {formatUSD(policy.premium)} USD
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-stone-100 pt-6">
                <Button onClick={() => window.print()}>
                  <Download className="size-4" /> Download Certificate
                </Button>
                <Link href="/portal/policies">
                  <Button variant="outline">
                    <Eye className="size-4" /> View Coverage
                  </Button>
                </Link>
                <Link href="/portal/emergency">
                  <Button variant="outline" className="border-red-200 text-red-700 hover:border-red-400 hover:bg-red-50 hover:text-red-800">
                    <Siren className="size-4" /> Emergency Assistance
                  </Button>
                </Link>
                <Link href="/claims">
                  <Button variant="outline">
                    <FilePlus2 className="size-4" /> Submit Claim
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* QR + trip countdown */}
        <FadeIn y={16} delay={0.08}>
          <div className="grid gap-6">
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
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-safari-50 text-safari-700">
                  <CalendarDays className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-stone-900">Trip to Victoria Falls</p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {formatDate(policy.startDate)} to {formatDate(policy.endDate)} · Tourism · Safari
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
    </DashboardShell>
  );
}
