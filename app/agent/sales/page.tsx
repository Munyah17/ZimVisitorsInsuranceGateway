"use client";

/**
 * Agent Portal — My Sales. Full sales history for the signed-in agent.
 */

import Link from "next/link";
import { FileText, Plus, TrendingUp, Wallet } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { MOCK_AGENT, type AgentCustomer } from "@/lib/mock-data";
import { AGENT_NAV } from "../nav";
import { formatDate, formatUSD } from "@/lib/utils";

/** Recent sales plus older history for the full statement view. */
const ALL_SALES: AgentCustomer[] = [
  ...MOCK_AGENT.recentCustomers,
  { name: "Emma Wilson", country: "Australia", product: "Visitor Premium", premium: 30, date: "2026-07-11", status: "active" },
  { name: "Lars Eriksen", country: "Norway", product: "Visitor Premium", premium: 47, date: "2026-07-10", status: "active" },
  { name: "Priya Patel", country: "India", product: "Visitor Premium", premium: 30, date: "2026-07-08", status: "active" },
  { name: "Tom Becker", country: "Germany", product: "Visitor Premium", premium: 34, date: "2026-07-05", status: "active" },
  { name: "Aisha Diallo", country: "Nigeria", product: "Visitor Premium", premium: 30, date: "2026-07-02", status: "active" },
];

export default function AgentSalesPage() {
  const totalPremium = ALL_SALES.reduce((s, c) => s + c.premium, 0);

  return (
    <DashboardShell
      title="My Sales"
      subtitle={`${MOCK_AGENT.name} · ${MOCK_AGENT.organization}`}
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
          <StatTile accent label="Policies this month" value={String(MOCK_AGENT.stats.policiesSold)} hint={`+${MOCK_AGENT.stats.monthGrowthPct}% vs last month`} icon={FileText} />
          <StatTile label="Premium written" value={formatUSD(totalPremium)} hint="Last 10 sales shown below" icon={Wallet} />
          <StatTile label="Average premium" value={formatUSD(Math.round(totalPremium / ALL_SALES.length))} hint="Per policy" icon={TrendingUp} />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sales history</CardTitle>
            <CardDescription>Every policy sold under your agent code {MOCK_AGENT.agentCode}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                    <th className="pb-3 pr-4 font-semibold">Visitor</th>
                    <th className="pb-3 pr-4 font-semibold">Country</th>
                    <th className="pb-3 pr-4 font-semibold">Plan</th>
                    <th className="pb-3 pr-4 font-semibold">Premium</th>
                    <th className="pb-3 pr-4 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_SALES.map((c) => (
                    <tr key={c.name + c.date} className="border-b border-stone-100 last:border-0">
                      <td className="py-3.5 pr-4 font-medium text-stone-900">{c.name}</td>
                      <td className="py-3.5 pr-4 text-stone-600">{c.country}</td>
                      <td className="py-3.5 pr-4 text-stone-600">{c.product}</td>
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
          </CardContent>
        </Card>
      </FadeIn>
    </DashboardShell>
  );
}
