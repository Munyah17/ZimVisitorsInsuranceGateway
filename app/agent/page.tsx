"use client";

/**
 * Agent Portal — dashboard. Live data from /api/agent/data, scoped to
 * the signed-in agent's own sales.
 */

import Link from "next/link";
import { Users, FileText, Wallet, Plus, BadgeCheck, Loader2 } from "lucide-react";
import { AGENT_NAV } from "./nav";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { useRoleData } from "@/lib/use-role-data";
import { formatDate, formatUSD } from "@/lib/utils";

interface AgentData {
  profile: { name: string; agentCode: string; organization: string | null; commissionRate: number };
  stats: { visitorsInsured: number; policiesSold: number; commissionEarned: number };
  policies: { policyNumber: string; name: string; country: string; premium: number; status: string; date: string }[];
}

export default function AgentPage() {
  const { data, loading } = useRoleData<AgentData>("/api/agent/data");

  if (loading || !data) {
    return (
      <DashboardShell title="Agent dashboard" nav={AGENT_NAV}>
        <div className="flex justify-center py-24 text-stone-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const { profile, stats } = data;

  return (
    <DashboardShell
      title="Agent dashboard"
      subtitle={`${profile.name}${profile.organization ? ` · ${profile.organization}` : ""} · ${profile.agentCode}`}
      nav={AGENT_NAV}
      badge={
        <Link href="/quote">
          <Button variant="accent">
            <Plus className="size-4" /> New quote
          </Button>
        </Link>
      }
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Policies sold" value={String(stats.policiesSold)} hint="All time" icon={FileText} />
          <StatTile
            label="Commission earned"
            value={formatUSD(stats.commissionEarned)}
            hint={`${(profile.commissionRate * 100).toFixed(0)}% of premium`}
            icon={Wallet}
          />
          <StatTile label="Visitors insured" value={String(stats.visitorsInsured)} hint="All time" icon={Users} />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent customers</CardTitle>
              <CardDescription>Your latest visitor insurance sales</CardDescription>
            </div>
            <Link href="/agent/sales">
              <Button variant="outline" size="sm">View all sales</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.policies.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">
                No sales yet. Policies bought with your agent code will show up here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                      <th className="pb-3 pr-4 font-semibold">Visitor</th>
                      <th className="pb-3 pr-4 font-semibold">Country</th>
                      <th className="pb-3 pr-4 font-semibold">Premium</th>
                      <th className="pb-3 pr-4 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.policies.slice(0, 10).map((c) => (
                      <tr key={c.policyNumber} className="border-b border-stone-100 last:border-0">
                        <td className="py-3.5 pr-4 font-medium text-stone-900">{c.name}</td>
                        <td className="py-3.5 pr-4 text-stone-600">{c.country}</td>
                        <td className="py-3.5 pr-4 font-medium text-stone-900">{formatUSD(c.premium)}</td>
                        <td className="py-3.5 pr-4 text-stone-500">{formatDate(c.date)}</td>
                        <td className="py-3.5">
                          <Badge variant={c.status === "active" ? "success" : "warning"}>
                            {c.status === "active" ? "Active" : "Pending payment"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn y={16}>
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-safari-100 bg-safari-50 px-6 py-5">
          <BadgeCheck className="size-6 shrink-0 text-safari-700" />
          <p className="text-sm text-safari-900">
            <strong>Sell in seconds:</strong> generate a quote for a walk-in visitor and
            they pay on their own phone. Commission attribution for agent-assisted
            sales is coming soon — for now, sales here reflect policies already
            linked to your agent code.
          </p>
          <Link href="/quote" className="ml-auto">
            <Button size="sm">Start a quote</Button>
          </Link>
        </div>
      </FadeIn>
    </DashboardShell>
  );
}
