"use client";

/**
 * Admin — Claims. Triage queue; assessment authority sits with the underwriter.
 */

import { CircleCheck, Clock, ShieldAlert } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { MOCK_ADMIN, type ClaimStatus } from "@/lib/mock-data";
import { ADMIN_NAV } from "../nav";
import { formatDate, formatUSD } from "@/lib/utils";

const CLAIMS = [
  ...MOCK_ADMIN.recentClaims,
  { claimNumber: "ZVIG-C-2026-0002", holder: "James Okoro", type: "Accident", amount: 480, status: "rejected" as ClaimStatus, date: "2026-07-04" },
  { claimNumber: "ZVIG-C-2026-0001", holder: "John Smith", type: "Medical", amount: 310, status: "closed" as ClaimStatus, date: "2026-06-28" },
];

const BADGE: Record<ClaimStatus, { label: string; variant: "success" | "warning" | "info" | "outline" | "destructive" }> = {
  submitted: { label: "Submitted", variant: "info" },
  under_review: { label: "Under review", variant: "warning" },
  forwarded_to_underwriter: { label: "With underwriter", variant: "info" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  paid: { label: "Paid", variant: "success" },
  closed: { label: "Closed", variant: "outline" },
};

export default function AdminClaimsPage() {
  const open = CLAIMS.filter((c) => ["submitted", "under_review", "forwarded_to_underwriter"].includes(c.status)).length;
  const paid = CLAIMS.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);

  return (
    <DashboardShell
      title="Claims"
      subtitle="Intake and triage. Assessment sits with the underwriter"
      nav={ADMIN_NAV}
      badge={<Badge variant="warning" className="px-3 py-1.5">{open} awaiting action</Badge>}
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Open claims" value={String(MOCK_ADMIN.metrics.openClaims)} hint="Across all policies" icon={ShieldAlert} />
          <StatTile label="Average turnaround" value="2.4 days" hint="Submission to decision" icon={Clock} />
          <StatTile label="Paid this month" value={formatUSD(paid)} hint="Settled to customers" icon={CircleCheck} />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Claims queue</CardTitle>
            <CardDescription>Newest first. Open a claim to triage documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                    <th className="pb-3 pr-4 font-semibold">Claim</th>
                    <th className="pb-3 pr-4 font-semibold">Holder</th>
                    <th className="pb-3 pr-4 font-semibold">Type</th>
                    <th className="pb-3 pr-4 font-semibold">Amount</th>
                    <th className="pb-3 pr-4 font-semibold">Date</th>
                    <th className="pb-3 pr-4 font-semibold">Status</th>
                    <th className="pb-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {CLAIMS.map((c) => {
                    const b = BADGE[c.status];
                    return (
                      <tr key={c.claimNumber} className="border-b border-stone-100 last:border-0">
                        <td className="py-3.5 pr-4 font-mono text-xs text-stone-500">{c.claimNumber}</td>
                        <td className="py-3.5 pr-4 font-medium text-stone-900">{c.holder}</td>
                        <td className="py-3.5 pr-4 text-stone-600">{c.type}</td>
                        <td className="py-3.5 pr-4 font-medium tabular-nums text-stone-900">{formatUSD(c.amount)}</td>
                        <td className="py-3.5 pr-4 text-stone-500">{formatDate(c.date)}</td>
                        <td className="py-3.5 pr-4"><Badge variant={b.variant}>{b.label}</Badge></td>
                        <td className="py-3.5 text-right">
                          <Button variant="outline" size="sm">Open</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </DashboardShell>
  );
}
