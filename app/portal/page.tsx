"use client";

/**
 * Client Portal — Dashboard. Live data from /api/portal/data, scoped to
 * the signed-in customer's own policies.
 */

import Link from "next/link";
import {
  FilePlus2,
  Siren,
  Download,
  Eye,
  ShieldCheck,
  Check,
  CalendarDays,
  FileText,
  Plane,
  Loader2,
} from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { QrCodeImage, policyVerifyUrl } from "@/components/qr-code";
import { CLIENT_NAV } from "./nav";
import { useRoleData } from "@/lib/use-role-data";
import { formatDate, formatUSD } from "@/lib/utils";

interface PortalPolicy {
  policyNumber: string;
  holderName: string;
  nationality: string | null;
  productName: string;
  coverageSummary: string;
  startDate: string;
  endDate: string;
  premium: number;
  currency: string;
  status: string;
}

interface PortalData {
  profile: { name: string; email: string; nationality: string | null; passportNumber: string | null };
  stats: { active: number; expired: number; totalPremiums: number; openClaims: number };
  policies: PortalPolicy[];
}

export default function PortalPage() {
  const { data, loading } = useRoleData<PortalData>("/api/portal/data");

  if (loading || !data) {
    return (
      <DashboardShell title="Dashboard" nav={CLIENT_NAV}>
        <div className="flex justify-center py-24 text-stone-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const { profile, stats, policies } = data;
  const firstName = profile.name.split(" ")[0];
  const activePolicy = policies.find((p) => p.status === "active") ?? null;

  const daysLeft = activePolicy
    ? Math.max(0, Math.ceil((new Date(activePolicy.endDate + "T00:00:00").getTime() - Date.now()) / 86_400_000))
    : 0;

  return (
    <DashboardShell
      title={`Welcome back, ${firstName}`}
      subtitle="Your Zimbabwe visitor insurance at a glance"
      nav={CLIENT_NAV}
      badge={
        activePolicy ? (
          <Badge variant="success" className="px-3 py-1.5 text-sm">
            <Check className="size-3.5" /> STATUS: ACTIVE
          </Badge>
        ) : (
          <Link href="/quote">
            <Button variant="accent">Get cover</Button>
          </Link>
        )
      }
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            accent
            label="Cover remaining"
            value={activePolicy ? `${daysLeft} days` : "—"}
            hint={activePolicy ? `Expires ${formatDate(activePolicy.endDate)}` : "No active policy"}
            icon={ShieldCheck}
          />
          <StatTile
            label="Active policies"
            value={String(stats.active)}
            hint={`${policies.length} total on your account`}
            icon={FileText}
          />
          <StatTile label="Open claims" value={String(stats.openClaims)} hint="Being reviewed" icon={FilePlus2} />
          <StatTile label="Trips insured" value={String(policies.length)} hint="Since you joined" icon={Plane} />
        </div>
      </FadeIn>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2" y={16}>
          <Card className="overflow-hidden">
            {activePolicy ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 bg-safari-950 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-sunset-300">
                      <ShieldCheck className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-safari-200/60">Active policy</p>
                      <p className="font-mono text-lg font-bold text-white">{activePolicy.policyNumber}</p>
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
                      <dd className="mt-1 font-semibold text-stone-900">{activePolicy.productName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-stone-400">Valid</dt>
                      <dd className="mt-1 font-semibold text-stone-900">
                        {formatDate(activePolicy.startDate)} to {formatDate(activePolicy.endDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-stone-400">Premium paid</dt>
                      <dd className="mt-1 font-semibold text-stone-900">{formatUSD(activePolicy.premium)}</dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-stone-100 pt-6">
                    <a href={`/api/certificate/${encodeURIComponent(activePolicy.policyNumber)}`}>
                      <Button>
                        <Download className="size-4" /> Download Certificate
                      </Button>
                    </a>
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
              </>
            ) : (
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <ShieldCheck className="size-10 text-stone-300" />
                <p className="font-semibold text-stone-900">No active policy yet</p>
                <p className="max-w-sm text-sm text-stone-500">
                  Get a quote for your next trip to Zimbabwe and your certificate will
                  appear here the moment payment is confirmed.
                </p>
                <Link href="/quote">
                  <Button className="mt-2">Get a quote</Button>
                </Link>
              </CardContent>
            )}
          </Card>
        </FadeIn>

        <FadeIn y={16} delay={0.08}>
          <div className="grid gap-6">
            {activePolicy && (
              <>
                <Card>
                  <CardContent className="flex items-center gap-5 p-6">
                    <span className="grid size-24 shrink-0 place-items-center rounded-xl border border-stone-200 bg-white p-2">
                      <QrCodeImage value={policyVerifyUrl(activePolicy.policyNumber)} size={80} />
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
                      <p className="font-semibold text-stone-900">{activePolicy.coverageSummary}</p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {formatDate(activePolicy.startDate)} to {formatDate(activePolicy.endDate)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </FadeIn>
      </div>
    </DashboardShell>
  );
}
