"use client";

/**
 * Admin — Policies. Register of issued policies across all channels.
 * Live data from /api/admin/data.
 */

import { FileText, Globe2, Loader2, Wallet } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/motion";
import { useRoleData } from "@/lib/use-role-data";
import { ADMIN_NAV } from "../nav";
import { formatUSD } from "@/lib/utils";

interface AdminData {
  metrics: { policiesToday: number; revenueToday: number; countriesCovered: number };
  recentPolicies: { policyNumber: string; holder: string; country: string; premium: number; channel: string; status: string; date: string }[];
}

const STATUS: Record<string, { label: string; variant: "success" | "warning" | "outline" | "destructive" }> = {
  active: { label: "Active", variant: "success" },
  pending_payment: { label: "Pending payment", variant: "warning" },
  expired: { label: "Expired", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  suspended: { label: "Suspended", variant: "outline" },
};

export default function AdminPoliciesPage() {
  const { data, loading } = useRoleData<AdminData>("/api/admin/data");

  if (loading || !data) {
    return (
      <DashboardShell title="Policies" subtitle="Register of issued cover across every channel" nav={ADMIN_NAV}>
        <div className="flex justify-center py-24 text-stone-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Policies" subtitle="Register of issued cover across every channel" nav={ADMIN_NAV}>
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Issued today" value={String(data.metrics.policiesToday)} hint="Since midnight" icon={FileText} />
          <StatTile label="Premium today" value={formatUSD(data.metrics.revenueToday)} hint="Gross written" icon={Wallet} />
          <StatTile label="Countries covered" value={String(data.metrics.countriesCovered)} hint="Visitor nationalities" icon={Globe2} />
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
            {data.recentPolicies.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">No policies yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                      <th className="pb-3 pr-4 font-semibold">Policy</th>
                      <th className="pb-3 pr-4 font-semibold">Holder</th>
                      <th className="pb-3 pr-4 font-semibold">Country</th>
                      <th className="pb-3 pr-4 font-semibold">Premium</th>
                      <th className="pb-3 pr-4 font-semibold">Channel</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentPolicies.map((p) => {
                      const s = STATUS[p.status] ?? { label: p.status, variant: "outline" as const };
                      return (
                        <tr key={p.policyNumber} className="border-b border-stone-100 last:border-0">
                          <td className="py-3.5 pr-4 font-mono text-xs text-stone-500">{p.policyNumber}</td>
                          <td className="py-3.5 pr-4 font-medium text-stone-900">{p.holder}</td>
                          <td className="py-3.5 pr-4 text-stone-600">{p.country}</td>
                          <td className="py-3.5 pr-4 font-medium tabular-nums text-stone-900">{formatUSD(p.premium)}</td>
                          <td className="py-3.5 pr-4 capitalize text-stone-500">{p.channel}</td>
                          <td className="py-3.5"><Badge variant={s.variant}>{s.label}</Badge></td>
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
