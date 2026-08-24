"use client";

/**
 * Client Portal — My Policies. Every policy on the account, past and
 * present. Live data from /api/portal/data.
 */

import Link from "next/link";
import { Download, FileText, Loader2, Plus, ShieldCheck } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CertificateFooter } from "@/components/certificate-footer";
import { ZimRibbon } from "@/components/zim-ribbon";
import { FadeIn } from "@/components/motion";
import { QrCodeImage, policyVerifyUrl } from "@/components/qr-code";
import { CLIENT_NAV } from "../nav";
import { useRoleData } from "@/lib/use-role-data";
import { formatDate, formatUSD } from "@/lib/utils";

interface PortalPolicy {
  policyNumber: string;
  productName: string;
  coverageSummary: string;
  startDate: string;
  endDate: string;
  premium: number;
  status: string;
}

interface PortalData {
  stats: { active: number; expired: number; totalPremiums: number; openClaims: number };
  policies: PortalPolicy[];
}

export default function MyPoliciesPage() {
  const { data, loading } = useRoleData<PortalData>("/api/portal/data");

  if (loading || !data) {
    return (
      <DashboardShell title="My Policies" nav={CLIENT_NAV}>
        <div className="flex justify-center py-24 text-stone-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const { stats, policies } = data;

  return (
    <DashboardShell
      title="My Policies"
      subtitle="All cover on your account, past and present"
      nav={CLIENT_NAV}
      badge={
        <Link href="/quote">
          <Button variant="accent">
            <Plus className="size-4" /> New policy
          </Button>
        </Link>
      }
    >
      <FadeIn y={16} className="print:hidden">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Active" value={String(stats.active)} hint="Currently covering you" icon={ShieldCheck} />
          <StatTile label="Expired" value={String(stats.expired)} hint="Past trips" icon={FileText} />
          <StatTile label="Total premiums" value={formatUSD(stats.totalPremiums)} hint="Lifetime" icon={Download} />
        </div>
      </FadeIn>

      {policies.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <ShieldCheck className="size-10 text-stone-300" />
            <p className="font-semibold text-stone-900">No policies yet</p>
            <p className="max-w-sm text-sm text-stone-500">
              Every policy you buy — for yourself or your group — will show up here.
            </p>
            <Link href="/quote">
              <Button className="mt-2">Get a quote</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-5">
          {policies.map((p, i) => (
            <FadeIn key={p.policyNumber} y={16} delay={i * 0.06}>
              <Card className="overflow-hidden">
                <ZimRibbon />
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/60 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-safari-950 text-sunset-300">
                      <ShieldCheck className="size-4" />
                    </span>
                    <span className="font-mono font-bold text-stone-900">{p.policyNumber}</span>
                  </div>
                  <Badge variant={p.status === "active" ? "success" : "outline"}>
                    {p.status === "active" ? "ACTIVE ✓" : p.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <CardContent className="flex flex-wrap items-start justify-between gap-6 p-6">
                  <div className="min-w-0 flex-1">
                    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone-400">Plan</dt>
                        <dd className="mt-1 text-sm font-semibold text-stone-900">{p.productName}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone-400">Coverage</dt>
                        <dd className="mt-1 text-sm font-semibold text-stone-900">{p.coverageSummary}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone-400">Valid</dt>
                        <dd className="mt-1 text-sm font-semibold text-stone-900">
                          {formatDate(p.startDate)} to {formatDate(p.endDate)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone-400">Premium</dt>
                        <dd className="mt-1 text-sm font-semibold text-stone-900">{formatUSD(p.premium)}</dd>
                      </div>
                    </dl>
                    <div className="mt-5 flex flex-wrap gap-3 border-t border-stone-100 pt-5">
                      <a href={`/api/certificate/${encodeURIComponent(p.policyNumber)}`}>
                        <Button size="sm" variant={p.status === "active" ? "default" : "outline"}>
                          <Download className="size-4" /> Certificate
                        </Button>
                      </a>
                    </div>
                  </div>
                  <span className="hidden shrink-0 rounded-xl border border-stone-200 bg-white p-2 sm:block">
                    <QrCodeImage value={policyVerifyUrl(p.policyNumber)} size={88} />
                  </span>
                </CardContent>
                <CertificateFooter />
              </Card>
            </FadeIn>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
