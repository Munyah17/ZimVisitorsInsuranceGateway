"use client";

/**
 * Agent Portal — for travel agents, tour operators and hotels.
 * Live version: `agents` + `policies` + `commissions` filtered by the
 * authenticated agent's user_id (RLS).
 */

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  ChartNoAxesColumn,
  Plus,
  TrendingUp,
  BadgeCheck,
} from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { MOCK_AGENT } from "@/lib/mock-data";
import { formatDate, formatUSD } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/agent", icon: LayoutDashboard },
  { label: "My Sales", href: "/agent", icon: FileText },
  { label: "Visitors", href: "/agent", icon: Users },
  { label: "Commissions", href: "/agent", icon: Wallet },
  { label: "Reports", href: "/agent", icon: ChartNoAxesColumn },
];

export default function AgentPage() {
  const { stats } = MOCK_AGENT;

  return (
    <DashboardShell
      title={`Agent dashboard`}
      subtitle={`${MOCK_AGENT.name} · ${MOCK_AGENT.organization} · ${MOCK_AGENT.agentCode}`}
      nav={NAV}
      activeHref="/agent"
      badge={
        <Link href="/quote">
          <Button variant="accent">
            <Plus className="size-4" /> New quote
          </Button>
        </Link>
      }
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            accent
            label="Policies sold"
            value={String(stats.policiesSold)}
            hint="This month"
            icon={FileText}
          />
          <StatTile
            label="Commission earned"
            value={formatUSD(stats.commissionEarned)}
            hint={`${(MOCK_AGENT.commissionRate * 100).toFixed(0)}% of premium`}
            icon={Wallet}
          />
          <StatTile
            label="Active visitors"
            value={String(stats.visitorsInsured)}
            hint="Currently insured"
            icon={Users}
          />
          <StatTile
            label="Growth"
            value={`+${stats.monthGrowthPct}%`}
            hint="vs last month"
            icon={TrendingUp}
          />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent customers</CardTitle>
              <CardDescription>Your latest visitor insurance sales</CardDescription>
            </div>
            <Button variant="outline" size="sm">View all sales</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
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
                  {MOCK_AGENT.recentCustomers.map((c) => (
                    <tr key={c.name} className="border-b border-stone-100 last:border-0">
                      <td className="py-3.5 pr-4 font-medium text-stone-900">{c.name}</td>
                      <td className="py-3.5 pr-4 text-stone-600">{c.country}</td>
                      <td className="py-3.5 pr-4 text-stone-600">{c.product}</td>
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
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn y={16}>
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-safari-100 bg-safari-50 px-6 py-5">
          <BadgeCheck className="size-6 shrink-0 text-safari-700" />
          <p className="text-sm text-safari-900">
            <strong>Sell in seconds:</strong> generate a quote for a walk-in visitor and
            they pay on their own phone — your commission is credited automatically
            when the policy activates.
          </p>
          <Link href="/quote" className="ml-auto">
            <Button size="sm">Start a quote</Button>
          </Link>
        </div>
      </FadeIn>
    </DashboardShell>
  );
}
