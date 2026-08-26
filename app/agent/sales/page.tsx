"use client";

/**
 * Agent Portal — My Sales. Full sales history, live from /api/agent/data.
 */

import Link from "next/link";
import { FileText, Loader2, Plus, TrendingUp, Wallet } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { useRoleData } from "@/lib/use-role-data";
import { AGENT_NAV } from "../nav";
import { formatDate, formatUSD } from "@/lib/utils";

interface AgentData {
  profile: { name: string; agentCode: string; organization: string | null };
  policies: { policyNumber: string; name: string; country: string; premium: number; status: string; date: string }[];
}

export default function AgentSalesPage() {
  const { data, loading } = useRoleData<AgentData>("/api/agent/data");

  if (loading || !data) {
    return (
      <DashboardShell title="My Sales" nav={AGENT_NAV}>
        <div className="flex justify-center py-24 text-stone-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const totalPremium = data.policies.reduce((s, c) => s + c.premium, 0);
  const avgPremium = data.policies.length > 0 ? Math.round(totalPremium / data.policies.length) : 0;

  return (
    <DashboardShell
      title="My Sales"
      subtitle={`${data.profile.name}${data.profile.organization ? ` · ${data.profile.organization}` : ""}`}
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
          <StatTile accent label="Policies sold" value={String(data.policies.length)} hint="All time" icon={FileText} />
          <StatTile label="Premium written" value={formatUSD(totalPremium)} hint="All time" icon={Wallet} />
          <StatTile label="Average premium" value={formatUSD(avgPremium)} hint="Per policy" icon={TrendingUp} />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sales history</CardTitle>
            <CardDescription>Every policy sold under your agent code {data.profile.agentCode}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.policies.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">No sales yet.</p>
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
                    {data.policies.map((c) => (
                      <tr key={c.policyNumber} className="border-b border-stone-100 last:border-0">
                        <td className="py-3.5 pr-4 font-medium text-stone-900">{c.name}</td>
                        <td className="py-3.5 pr-4 text-stone-600">{c.country}</td>
                        <td className="py-3.5 pr-4 font-medium tabular-nums text-stone-900">{formatUSD(c.premium)}</td>
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
    </DashboardShell>
  );
}
