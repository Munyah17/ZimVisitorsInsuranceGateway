"use client";

/**
 * Admin — Agents. Distribution network management and approvals.
 */

import { BadgeCheck, Users, Wallet } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { MOCK_ADMIN } from "@/lib/mock-data";
import { ADMIN_NAV } from "../nav";
import { formatUSD } from "@/lib/utils";

const AGENTS = [
  { code: "AGT-0001", ...MOCK_ADMIN.agentPerformance[0], status: "active" },
  { code: "AGT-0002", ...MOCK_ADMIN.agentPerformance[1], status: "active" },
  { code: "AGT-0003", ...MOCK_ADMIN.agentPerformance[2], status: "active" },
  { code: "AGT-0004", ...MOCK_ADMIN.agentPerformance[3], status: "active" },
  { code: "AGT-0005", agent: "Nyasha Gumbo", org: "Kariba Houseboats", policies: 0, commission: 0, status: "pending_approval" },
  { code: "AGT-0006", agent: "Tariro Sibanda", org: "Matobo Hills Lodge", policies: 0, commission: 0, status: "pending_approval" },
];

export default function AdminAgentsPage() {
  const pending = AGENTS.filter((a) => a.status === "pending_approval").length;

  return (
    <DashboardShell
      title="Agents"
      subtitle="Your distribution network: agents, operators and hotel desks"
      nav={ADMIN_NAV}
      badge={<Badge variant="warning" className="px-3 py-1.5">{pending} awaiting approval</Badge>}
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Active agents" value="42" hint="Across 18 partner organizations" icon={Users} />
          <StatTile label="Agent-sold share" value="38%" hint="Of all policies this month" icon={BadgeCheck} />
          <StatTile label="Commission liability (YTD)" value={formatUSD(MOCK_ADMIN.metrics.commissionLiabilityYtd)} hint="Accrued + approved, year to date" icon={Wallet} />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Agent roster</CardTitle>
            <CardDescription>Performance this month, and applications to review</CardDescription>
          </CardHeader>
          <CardContent>
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
                  {AGENTS.map((a) => (
                    <tr key={a.code} className="border-b border-stone-100 last:border-0">
                      <td className="py-3.5 pr-4 font-mono text-xs text-stone-500">{a.code}</td>
                      <td className="py-3.5 pr-4 font-medium text-stone-900">{a.agent}</td>
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
          </CardContent>
        </Card>
      </FadeIn>
    </DashboardShell>
  );
}
