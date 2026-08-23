"use client";

/**
 * Agent Portal — Visitors. Everyone currently insured through this agent,
 * live from /api/agent/data.
 */

import { Globe2, Loader2, Users } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { useRoleData } from "@/lib/use-role-data";
import { AGENT_NAV } from "../nav";
import { formatDate } from "@/lib/utils";

interface AgentData {
  profile: { agentCode: string };
  policies: { policyNumber: string; name: string; country: string; status: string; startDate: string; endDate: string }[];
}

export default function AgentVisitorsPage() {
  const { data, loading } = useRoleData<AgentData>("/api/agent/data");

  if (loading || !data) {
    return (
      <DashboardShell title="Visitors" nav={AGENT_NAV}>
        <div className="flex justify-center py-24 text-stone-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const active = data.policies.filter((v) => v.status === "active" && v.endDate >= today);
  const countries = new Set(active.map((v) => v.country)).size;

  return (
    <DashboardShell
      title="Visitors"
      subtitle="Everyone currently covered through your desk"
      nav={AGENT_NAV}
      badge={<Badge variant="success" className="px-3 py-1.5">{active.length} insured now</Badge>}
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile accent label="Active visitors" value={String(active.length)} hint="Currently in country" icon={Users} />
          <StatTile label="Nationalities" value={String(countries)} hint="Among your active visitors" icon={Globe2} />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Currently insured</CardTitle>
            <CardDescription>Live policies attributed to {data.profile.agentCode}</CardDescription>
          </CardHeader>
          <CardContent>
            {active.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">No active visitors right now.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {active.map((v) => (
                  <div
                    key={v.policyNumber}
                    className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/60 px-4 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-900">
                        {v.name} <span className="font-normal text-stone-400">· {v.country}</span>
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-stone-400">{v.policyNumber}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-stone-500">until {formatDate(v.endDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </DashboardShell>
  );
}
