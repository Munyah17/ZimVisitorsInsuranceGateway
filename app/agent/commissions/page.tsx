"use client";

/**
 * Agent Portal — Commissions. Statement of earnings per policy.
 */

import { CircleCheck, Clock, Wallet } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { MOCK_AGENT } from "@/lib/mock-data";
import { AGENT_NAV } from "../nav";
import { formatDate, formatUSD } from "@/lib/utils";

const STATEMENT = [
  { policy: "ZVIG-2026-01847", customer: "John Smith", premium: 30, status: "accrued", date: "2026-07-16" },
  { policy: "ZVIG-2026-01792", customer: "Chloé Dubois", premium: 42, status: "accrued", date: "2026-07-15" },
  { policy: "ZVIG-2026-01788", customer: "Marco Rossi", premium: 12, status: "approved", date: "2026-07-15" },
  { policy: "ZVIG-2026-01760", customer: "Yuki Tanaka", premium: 10, status: "approved", date: "2026-07-13" },
  { policy: "ZVIG-2026-01741", customer: "Emma Wilson", premium: 27, status: "paid", date: "2026-07-11" },
  { policy: "ZVIG-2026-01710", customer: "Tom Becker", premium: 34, status: "paid", date: "2026-07-05" },
  { policy: "ZVIG-2026-01694", customer: "Aisha Diallo", premium: 12, status: "paid", date: "2026-07-02" },
];

const STATUS_BADGE = {
  accrued: { label: "Accrued", variant: "info" as const },
  approved: { label: "Approved", variant: "warning" as const },
  paid: { label: "Paid", variant: "success" as const },
};

export default function AgentCommissionsPage() {
  const rate = MOCK_AGENT.commissionRate;
  const sum = (s: string) =>
    STATEMENT.filter((r) => r.status === s).reduce((t, r) => t + r.premium * rate, 0);

  return (
    <DashboardShell
      title="Commissions"
      subtitle={`Your share is ${(rate * 100).toFixed(0)}% of every premium you write`}
      nav={AGENT_NAV}
      badge={<Badge className="px-3 py-1.5">Next payout: 31 Jul 2026</Badge>}
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Paid out (lifetime)" value={formatUSD(MOCK_AGENT.stats.commissionEarned)} hint="Since you joined" icon={Wallet} />
          <StatTile label="Approved, awaiting payout" value={formatUSD(Math.round(sum("approved") * 100) / 100)} hint="In the 31 Jul run" icon={Clock} />
          <StatTile label="Accrued this week" value={formatUSD(Math.round(sum("accrued") * 100) / 100)} hint="Approval within 48 h" icon={CircleCheck} />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Commission statement</CardTitle>
            <CardDescription>
              One line per policy. Accrued becomes approved after payment
              reconciliation, then paid in the monthly run.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                    <th className="pb-3 pr-4 font-semibold">Policy</th>
                    <th className="pb-3 pr-4 font-semibold">Customer</th>
                    <th className="pb-3 pr-4 font-semibold">Premium</th>
                    <th className="pb-3 pr-4 font-semibold">Commission</th>
                    <th className="pb-3 pr-4 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {STATEMENT.map((r) => {
                    const badge = STATUS_BADGE[r.status as keyof typeof STATUS_BADGE];
                    return (
                      <tr key={r.policy} className="border-b border-stone-100 last:border-0">
                        <td className="py-3.5 pr-4 font-mono text-xs text-stone-500">{r.policy}</td>
                        <td className="py-3.5 pr-4 font-medium text-stone-900">{r.customer}</td>
                        <td className="py-3.5 pr-4 tabular-nums text-stone-700">{formatUSD(r.premium)}</td>
                        <td className="py-3.5 pr-4 font-semibold tabular-nums text-stone-900">
                          {formatUSD(Math.round(r.premium * rate * 100) / 100)}
                        </td>
                        <td className="py-3.5 pr-4 text-stone-500">{formatDate(r.date)}</td>
                        <td className="py-3.5">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
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
