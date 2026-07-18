"use client";

/**
 * Admin — Policies. Register of issued policies across all channels.
 */

import { FileText, Globe2, Wallet } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/motion";
import { MOCK_ADMIN } from "@/lib/mock-data";
import { ADMIN_NAV } from "../nav";
import { formatUSD } from "@/lib/utils";

const POLICIES = [
  { number: "ZVIG-2026-01847", holder: "Emma Wilson", country: "Australia", plan: "Visitor Premium", premium: 25, channel: "Web", status: "active" },
  { number: "ZVIG-2026-01846", holder: "Lars Eriksen", country: "Norway", plan: "Visitor Plus", premium: 47, channel: "WhatsApp", status: "active" },
  { number: "ZVIG-2026-01845", holder: "Priya Patel", country: "India", plan: "Visitor Essential", premium: 10, channel: "Agent", status: "active" },
  { number: "ZVIG-2026-01844", holder: "Tom Becker", country: "Germany", plan: "Adventure Rider", premium: 30, channel: "Web", status: "active" },
  { number: "ZVIG-2026-01843", holder: "Sarah Johnson", country: "United States", plan: "Visitor Premium", premium: 33, channel: "Agent", status: "pending_payment" },
  { number: "ZVIG-2026-01842", holder: "Chen Wei", country: "China", plan: "Visitor Essential", premium: 12, channel: "Web", status: "active" },
  { number: "ZVIG-2026-01841", holder: "Anna Müller", country: "Germany", plan: "Visitor Essential", premium: 12, channel: "Web", status: "expired" },
  { number: "ZVIG-2026-01840", holder: "James Okoro", country: "Nigeria", plan: "Visitor Premium", premium: 28, channel: "WhatsApp", status: "active" },
];

const STATUS = {
  active: { label: "Active", variant: "success" as const },
  pending_payment: { label: "Pending payment", variant: "warning" as const },
  expired: { label: "Expired", variant: "outline" as const },
};

export default function AdminPoliciesPage() {
  return (
    <DashboardShell
      title="Policies"
      subtitle="Register of issued cover across every channel"
      nav={ADMIN_NAV}
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Issued today" value={String(MOCK_ADMIN.metrics.policiesToday)} hint="+12% vs yesterday" icon={FileText} />
          <StatTile label="Premium today" value={formatUSD(MOCK_ADMIN.metrics.revenueToday)} hint="Gross written" icon={Wallet} />
          <StatTile label="Countries covered" value={String(MOCK_ADMIN.metrics.countriesCovered)} hint="Visitor nationalities" icon={Globe2} />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Policy register</CardTitle>
              <CardDescription>Most recent issuances first</CardDescription>
            </div>
            <Input placeholder="Search policy number or name…" className="h-10 w-full sm:w-72" />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                    <th className="pb-3 pr-4 font-semibold">Policy</th>
                    <th className="pb-3 pr-4 font-semibold">Holder</th>
                    <th className="pb-3 pr-4 font-semibold">Country</th>
                    <th className="pb-3 pr-4 font-semibold">Plan</th>
                    <th className="pb-3 pr-4 font-semibold">Premium</th>
                    <th className="pb-3 pr-4 font-semibold">Channel</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {POLICIES.map((p) => {
                    const s = STATUS[p.status as keyof typeof STATUS];
                    return (
                      <tr key={p.number} className="border-b border-stone-100 last:border-0">
                        <td className="py-3.5 pr-4 font-mono text-xs text-stone-500">{p.number}</td>
                        <td className="py-3.5 pr-4 font-medium text-stone-900">{p.holder}</td>
                        <td className="py-3.5 pr-4 text-stone-600">{p.country}</td>
                        <td className="py-3.5 pr-4 text-stone-600">{p.plan}</td>
                        <td className="py-3.5 pr-4 font-medium tabular-nums text-stone-900">{formatUSD(p.premium)}</td>
                        <td className="py-3.5 pr-4 text-stone-500">{p.channel}</td>
                        <td className="py-3.5"><Badge variant={s.variant}>{s.label}</Badge></td>
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
