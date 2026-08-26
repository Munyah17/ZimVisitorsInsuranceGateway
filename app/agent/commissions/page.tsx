"use client";

/**
 * Agent Portal — Commissions. Live data from /api/agent/data.
 */

import { CircleCheck, Clock, Loader2, Wallet } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { useRoleData } from "@/lib/use-role-data";
import { AGENT_NAV } from "../nav";
import { formatDate, formatUSD } from "@/lib/utils";

interface AgentData {
  profile: { commissionRate: number };
  commissions: { policyNumber: string; amount: number; status: string; date: string }[];
}

const STATUS_BADGE: Record<string, { label: string; variant: "info" | "warning" | "success" }> = {
  accrued: { label: "Accrued", variant: "info" },
  approved: { label: "Approved", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
};

export default function AgentCommissionsPage() {
  const { data, loading } = useRoleData<AgentData>("/api/agent/data");

  if (loading || !data) {
    return (
      <DashboardShell title="Commissions" nav={AGENT_NAV}>
        <div className="flex justify-center py-24 text-stone-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const sum = (status: string) => data.commissions.filter((c) => c.status === status).reduce((s, c) => s + c.amount, 0);

  return (
    <DashboardShell
      title="Commissions"
      subtitle={`Your share is ${(data.profile.commissionRate * 100).toFixed(0)}% of every premium you write`}
      nav={AGENT_NAV}
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Paid out (lifetime)" value={formatUSD(sum("paid"))} hint="Since you joined" icon={Wallet} />
          <StatTile label="Approved, awaiting payout" value={formatUSD(sum("approved"))} hint="Next payout run" icon={Clock} />
          <StatTile label="Accrued" value={formatUSD(sum("accrued"))} hint="Pending reconciliation" icon={CircleCheck} />
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
            {data.commissions.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">No commissions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                      <th className="pb-3 pr-4 font-semibold">Policy</th>
                      <th className="pb-3 pr-4 font-semibold">Commission</th>
                      <th className="pb-3 pr-4 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.commissions.map((r) => {
                      const badge = STATUS_BADGE[r.status] ?? { label: r.status, variant: "info" as const };
                      return (
                        <tr key={r.policyNumber + r.date} className="border-b border-stone-100 last:border-0">
                          <td className="py-3.5 pr-4 font-mono text-xs text-stone-500">{r.policyNumber}</td>
                          <td className="py-3.5 pr-4 font-semibold tabular-nums text-stone-900">{formatUSD(r.amount)}</td>
                          <td className="py-3.5 pr-4 text-stone-500">{formatDate(r.date)}</td>
                          <td className="py-3.5"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </DashboardShell>
  );
}
