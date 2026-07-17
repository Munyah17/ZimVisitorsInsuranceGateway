"use client";

/**
 * Admin Command Centre — enterprise operations dashboard.
 * Live version: aggregate queries over `policies`, `payments`, `claims`,
 * `agents` and `audit_logs` (admin role via RLS / service role).
 */

import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  Users,
  Building2,
  Settings,
  Globe2,
  Wallet,
  Activity,
  MessageCircle,
  MonitorSmartphone,
  UserRound,
} from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { MOCK_ADMIN, type ClaimStatus } from "@/lib/mock-data";
import { formatUSD } from "@/lib/utils";

const NAV = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Policies", href: "/admin", icon: FileText },
  { label: "Claims", href: "/admin", icon: ShieldAlert },
  { label: "Agents", href: "/admin", icon: Users },
  { label: "Organizations", href: "/admin", icon: Building2 },
  { label: "Settings", href: "/admin", icon: Settings },
];

const CLAIM_BADGE: Record<ClaimStatus, { label: string; variant: "success" | "warning" | "info" | "outline" | "destructive" }> = {
  submitted: { label: "Submitted", variant: "info" },
  under_review: { label: "Under review", variant: "warning" },
  forwarded_to_underwriter: { label: "With underwriter", variant: "info" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  paid: { label: "Paid", variant: "success" },
  closed: { label: "Closed", variant: "outline" },
};

const CHANNEL_ICON = {
  Web: MonitorSmartphone,
  WhatsApp: MessageCircle,
  Agent: UserRound,
} as const;

export default function AdminPage() {
  const { metrics } = MOCK_ADMIN;
  const maxPolicies = Math.max(...MOCK_ADMIN.policiesByCountry.map((c) => c.policies));

  return (
    <DashboardShell
      title="Admin Command Centre"
      subtitle="Hola Amigo Travelmate · live operations"
      nav={NAV}
      activeHref="/admin"
      badge={
        <Badge variant="success" className="px-3 py-1.5">
          <Activity className="size-3.5" /> All systems operational
        </Badge>
      }
    >
      {/* KPI row */}
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatTile accent label="Policies today" value={String(metrics.policiesToday)} hint="+12% vs yesterday" icon={FileText} />
          <StatTile label="Revenue today" value={formatUSD(metrics.revenueToday)} hint="Gross written premium" icon={Wallet} />
          <StatTile label="Open claims" value={String(metrics.openClaims)} hint="Awaiting action" icon={ShieldAlert} />
          <StatTile label="Active visitors" value={metrics.activeVisitors.toLocaleString()} hint="Covered in-country now" icon={Users} />
          <StatTile label="Countries covered" value={String(metrics.countriesCovered)} hint="Visitor nationalities" icon={Globe2} />
        </div>
      </FadeIn>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Policies by country — single-series bar list */}
        <FadeIn y={16}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Policies by country</CardTitle>
              <CardDescription>Active policies by visitor nationality, last 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {MOCK_ADMIN.policiesByCountry.map((c) => (
                  <li key={c.country}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="font-medium text-stone-700">{c.country}</span>
                      <span className="font-semibold tabular-nums text-stone-900">{c.policies}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-safari-600"
                        style={{ width: `${(c.policies / maxPolicies) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Agent performance */}
        <FadeIn y={16} delay={0.06}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Agent performance</CardTitle>
              <CardDescription>Top distribution partners this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                      <th className="pb-3 pr-4 font-semibold">Agent</th>
                      <th className="pb-3 pr-4 font-semibold">Policies</th>
                      <th className="pb-3 font-semibold">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_ADMIN.agentPerformance.map((a) => (
                      <tr key={a.agent} className="border-b border-stone-100 last:border-0">
                        <td className="py-3.5 pr-4">
                          <p className="font-medium text-stone-900">{a.agent}</p>
                          <p className="text-xs text-stone-400">{a.org}</p>
                        </td>
                        <td className="py-3.5 pr-4 tabular-nums text-stone-700">{a.policies}</td>
                        <td className="py-3.5 font-medium tabular-nums text-stone-900">
                          {formatUSD(a.commission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Claims queue */}
        <FadeIn y={16}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Claims queue</CardTitle>
              <CardDescription>Latest claims across all policies</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {MOCK_ADMIN.recentClaims.map((c) => {
                  const badge = CLAIM_BADGE[c.status];
                  return (
                    <li
                      key={c.claimNumber}
                      className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/60 px-4 py-3"
                    >
                      <div>
                        <p className="font-mono text-xs text-stone-400">{c.claimNumber}</p>
                        <p className="mt-0.5 text-sm font-medium text-stone-900">
                          {c.holder} · {c.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <p className="mt-1 text-xs font-semibold tabular-nums text-stone-600">
                          {formatUSD(c.amount)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Recent policies feed */}
        <FadeIn y={16} delay={0.06}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent policies</CardTitle>
              <CardDescription>Issued across web, WhatsApp and agent channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {MOCK_ADMIN.recentPolicies.map((p) => {
                  const Icon = CHANNEL_ICON[p.channel as keyof typeof CHANNEL_ICON] ?? MonitorSmartphone;
                  return (
                    <li
                      key={p.policyNumber}
                      className="flex items-center gap-3.5 rounded-xl border border-stone-100 bg-stone-50/60 px-4 py-3"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-safari-100 text-safari-700">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-900">
                          {p.holder} <span className="text-stone-400">· {p.country}</span>
                        </p>
                        <p className="font-mono text-xs text-stone-400">{p.policyNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums text-stone-900">
                          {formatUSD(p.premium)}
                        </p>
                        <p className="text-xs text-stone-400">{p.channel}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </DashboardShell>
  );
}
