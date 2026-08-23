"use client";

/**
 * Agent Portal — Reports. Real month-by-month and country breakdown,
 * computed client side from the agent's own policies (/api/agent/data).
 */

import { ChartNoAxesColumn, Globe2, Loader2, TrendingUp } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { useRoleData } from "@/lib/use-role-data";
import { AGENT_NAV } from "../nav";

interface AgentData {
  profile: { agentCode: string };
  policies: { policyNumber: string; country: string; date: string }[];
}

export default function AgentReportsPage() {
  const { data, loading } = useRoleData<AgentData>("/api/agent/data");

  if (loading || !data) {
    return (
      <DashboardShell title="Reports" nav={AGENT_NAV}>
        <div className="flex justify-center py-24 text-stone-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const monthly = new Map<string, number>();
  for (const p of data.policies) {
    const key = new Date(p.date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    monthly.set(key, (monthly.get(key) ?? 0) + 1);
  }
  const months = [...monthly.entries()].slice(-6);
  const maxMonth = Math.max(1, ...months.map(([, n]) => n));
  const bestMonth = months.reduce((best, cur) => (cur[1] > (best?.[1] ?? 0) ? cur : best), months[0]);

  const countries = new Map<string, number>();
  for (const p of data.policies) countries.set(p.country, (countries.get(p.country) ?? 0) + 1);
  const countryList = [...countries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const total = data.policies.length;

  return (
    <DashboardShell title="Reports" subtitle="How your desk is performing" nav={AGENT_NAV}>
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Best month" value={bestMonth?.[0] ?? "—"} hint={bestMonth ? `${bestMonth[1]} policies` : "No sales yet"} icon={TrendingUp} />
          <StatTile label="6 month total" value={String(months.reduce((s, [, n]) => s + n, 0))} hint="Policies sold" icon={ChartNoAxesColumn} />
          <StatTile label="Top nationality" value={countryList[0]?.[0] ?? "—"} hint={countryList[0] ? `${countryList[0][1]} of ${total} visitors` : "No sales yet"} icon={Globe2} />
        </div>
      </FadeIn>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FadeIn y={16}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Policies per month</CardTitle>
              <CardDescription>Sales attributed to {data.profile.agentCode}, last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {months.length === 0 ? (
                <p className="py-6 text-center text-sm text-stone-400">No sales yet.</p>
              ) : (
                <ul className="space-y-4">
                  {months.map(([month, count]) => (
                    <li key={month}>
                      <div className="mb-1.5 flex items-baseline justify-between text-sm">
                        <span className="font-medium text-stone-700">{month}</span>
                        <span className="font-semibold tabular-nums text-stone-900">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-safari-600" style={{ width: `${(count / maxMonth) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn y={16} delay={0.06}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Visitors by nationality</CardTitle>
              <CardDescription>Where your Visitor Premium sales come from</CardDescription>
            </CardHeader>
            <CardContent>
              {countryList.length === 0 ? (
                <p className="py-6 text-center text-sm text-stone-400">No sales yet.</p>
              ) : (
                <ul className="space-y-4">
                  {countryList.map(([country, count]) => (
                    <li key={country}>
                      <div className="mb-1.5 flex items-baseline justify-between text-sm">
                        <span className="font-medium text-stone-700">{country}</span>
                        <span className="font-semibold tabular-nums text-stone-900">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-safari-600" style={{ width: `${(count / total) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </DashboardShell>
  );
}
