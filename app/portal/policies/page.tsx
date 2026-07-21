"use client";

/**
 * Client Portal — My Policies. Every policy on the account, past and present.
 */

import Link from "next/link";
import { Download, Eye, FileText, Plus, ShieldCheck } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CertificateFooter } from "@/components/certificate-footer";
import { ZimRibbon } from "@/components/zim-ribbon";
import { FadeIn } from "@/components/motion";
import { MOCK_POLICIES } from "@/lib/mock-data";
import { CLIENT_NAV } from "../nav";
import { formatDate, formatUSD } from "@/lib/utils";

export default function MyPoliciesPage() {
  const active = MOCK_POLICIES.filter((p) => p.status === "active").length;
  const expired = MOCK_POLICIES.filter((p) => p.status === "expired").length;
  const totalPaid = MOCK_POLICIES.reduce((sum, p) => sum + p.premium, 0);

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
          <StatTile accent label="Active" value={String(active)} hint="Currently covering you" icon={ShieldCheck} />
          <StatTile label="Expired" value={String(expired)} hint="Past trips" icon={FileText} />
          <StatTile label="Total premiums" value={formatUSD(totalPaid)} hint="Lifetime" icon={Download} />
        </div>
      </FadeIn>

      <div className="mt-6 space-y-5">
        {MOCK_POLICIES.map((p, i) => (
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
                  {p.status === "active" ? "ACTIVE ✓" : "Expired"}
                </Badge>
              </div>
              <CardContent className="p-6">
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
                    <dd className="mt-1 text-sm font-semibold text-stone-900">{formatUSD(p.premium)} USD</dd>
                  </div>
                </dl>
                <div className="mt-5 flex flex-wrap gap-3 border-t border-stone-100 pt-5 print:hidden">
                  <Button size="sm" variant={p.status === "active" ? "default" : "outline"} onClick={() => window.print()}>
                    <Download className="size-4" /> Certificate
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="size-4" /> Details
                  </Button>
                </div>
              </CardContent>
              <CertificateFooter />
            </Card>
          </FadeIn>
        ))}
      </div>
    </DashboardShell>
  );
}
