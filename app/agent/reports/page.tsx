"use client";

/**
 * Agent Portal — Reports. Monthly performance for the signed-in agent.
 */

import { ChartNoAxesColumn, Package, TrendingUp } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { MOCK_AGENT } from "@/lib/mock-data";
import { AGENT_NAV } from "../nav";

const MONTHLY = [
  { month: "Feb", policies: 61 },
  { month: "Mar", policies: 74 },
  { month: "Apr", policies: 69 },
  { month: "May", policies: 88 },
  { month: "Jun", policies: 109 },
  { month: "Jul", policies: 128 },
];

const CHANNELS = [
  { name: "Your desk (walk-in)", share: 52 },
  { name: "Referral link", share: 31 },
  { name: "WhatsApp referrals", share: 17 },
];

export default function AgentReportsPage() {
  const max = Math.max(...MONTHLY.map((m) => m.policies));

  return (
    <DashboardShell
      title="Reports"
      subtitle="How your desk is performing month by month"
      nav={AGENT_NAV}
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Best month" value="Jul 2026" hint="128 policies and counting" icon={TrendingUp} />
          <StatTile label="6 month total" value={String(MONTHLY.reduce((s, m) => s + m.policies, 0))} hint="Policies sold" icon={ChartNoAxesColumn} />
          <StatTile label="Top channel" value="Your desk" hint="52% of your sales" icon={Package} />
        </div>
      </FadeIn>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FadeIn y={16}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Policies per month</CardTitle>
              <CardDescription>Sales attributed to {MOCK_AGENT.agentCode}, last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {MONTHLY.map((m) => (
                  <li key={m.month}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="font-medium text-stone-700">{m.month} 2026</span>
                      <span className="font-semibold tabular-nums text-stone-900">{m.policies}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-safari-600"
                        style={{ width: `${(m.policies / max) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn y={16} delay={0.06}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Sales by channel</CardTitle>
              <CardDescription>Where your Visitor Premium sales come from, last 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {CHANNELS.map((p) => (
                  <li key={p.name}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="font-medium text-stone-700">{p.name}</span>
                      <span className="font-semibold tabular-nums text-stone-900">{p.share}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-safari-600"
                        style={{ width: `${p.share}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-xl bg-safari-50 px-4 py-3 text-xs leading-relaxed text-safari-900">
                Tip: group bookings convert best at the till. One leader can
                cover the whole party in a single checkout.
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </DashboardShell>
  );
}
