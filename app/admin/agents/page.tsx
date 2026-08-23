"use client";

/**
 * Admin — Agents. Distribution network management and approvals.
 * Live data from /api/admin/data.
 */

import { BadgeCheck, Loader2, Users, Wallet } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { useRoleData } from "@/lib/use-role-data";
import { ADMIN_NAV } from "../nav";
import { formatUSD } from "@/lib/utils";

interface AdminData {
  metrics: { commissionLiabilityYtd: number };
  agents: { code: string; name: string; org: string; status: string; policies: number; commission: number }[];
}

export default function AdminAgentsPage() {
  const { data, loading } = useRoleData<AdminData>("/api/admin/data");

  if (loading || !data) {
    return (
      <DashboardShell title="Agents" subtitle="Your distribution network: agents, operators and hotel desks" nav={ADMIN_NAV}>
        <div className="flex justify-center py-24 text-stone-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const pending = data.agents.filter((a) => a.status === "pending_approval").length;
  const active = data.agents.filter((a) => a.status === "active").length;
  const totalPolicies = data.agents.reduce((s, a) => s + a.policies, 0);

  return (
    <DashboardShell
      title="Agents"
      subtitle="Your distribution network: agents, operators and hotel desks"
      nav={ADMIN_NAV}
      badge={pending > 0 ? <Badge variant="warning" className="px-3 py-1.5">{pending} awaiting approval</Badge> : undefined}
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Active agents" value={String(active)} hint={`${data.agents.length} total on the roster`} icon={Users} />
          <StatTile label="Agent-attributed policies" value={String(totalPolicies)} hint="Sold through the agent network" icon={BadgeCheck} />
          <StatTile label="Commission liability (YTD)" value={formatUSD(data.metrics.commissionLiabilityYtd)} hint="Accrued, not yet paid" icon={Wallet} />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Agent roster</CardTitle>
            <CardDescription>Performance to date, and applications to review</CardDescription>
          </CardHeader>
          <CardContent>
            {data.agents.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">No agents yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                      <th className="pb-3 pr-4 font-semibold">Code</th>
                      <th className="pb-3 pr-4 font-semibold">Agent</th>
                      <th className="pb-3 pr-4 font-semibold">Organization</th>
                      <th className="pb-3 pr-4 font-semibold">Policies</th>
                      <th className="pb-3 pr-4 font-semibold">Commission</th>
                      <th className="pb-3 pr-4 font-semibold">Status</th>
                      <th className="pb-3 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.agents.map((a) => (
                      <tr key={a.code} className="border-b border-stone-100 last:border-0">
                        <td className="py-3.5 pr-4 font-mono text-xs text-stone-500">{a.code}</td>
                        <td className="py-3.5 pr-4 font-medium text-stone-900">{a.name}</td>
                        <td className="py-3.5 pr-4 text-stone-600">{a.org}</td>
                        <td className="py-3.5 pr-4 tabular-nums text-stone-700">{a.policies}</td>
                        <td className="py-3.5 pr-4 tabular-nums text-stone-900">{formatUSD(a.commission)}</td>
                        <td className="py-3.5 pr-4">
                          <Badge variant={a.status === "active" ? "success" : "warning"}>
                            {a.status === "active" ? "Active" : "Pending"}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-right">
                          {a.status === "pending_approval" ? (
                            <Button size="sm">Approve</Button>
                          ) : (
                            <Button variant="outline" size="sm">View</Button>
                          )}
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
