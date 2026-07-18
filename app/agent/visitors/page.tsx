"use client";

/**
 * Agent Portal — Visitors. Everyone currently insured through this agent.
 */

import { Globe2, ShieldCheck, Users } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { MOCK_AGENT } from "@/lib/mock-data";
import { AGENT_NAV } from "../nav";
import { formatDate } from "@/lib/utils";

const VISITORS = [
  { name: "John Smith", country: "United Kingdom", policy: "ZVIG-2026-00001", until: "2026-08-20", activity: "Safari" },
  { name: "Chloé Dubois", country: "France", policy: "ZVIG-2026-01792", until: "2026-07-28", activity: "Adventure" },
  { name: "Marco Rossi", country: "Italy", policy: "ZVIG-2026-01788", until: "2026-07-24", activity: "General" },
  { name: "Yuki Tanaka", country: "Japan", policy: "ZVIG-2026-01760", until: "2026-07-21", activity: "Safari" },
  { name: "Emma Wilson", country: "Australia", policy: "ZVIG-2026-01741", until: "2026-07-30", activity: "General" },
  { name: "Tom Becker", country: "Germany", policy: "ZVIG-2026-01710", until: "2026-08-02", activity: "Adventure" },
];

export default function AgentVisitorsPage() {
  const countries = new Set(VISITORS.map((v) => v.country)).size;

  return (
    <DashboardShell
      title="Visitors"
      subtitle="Everyone currently covered through your desk"
      nav={AGENT_NAV}
      badge={<Badge variant="success" className="px-3 py-1.5">{MOCK_AGENT.stats.visitorsInsured} insured now</Badge>}
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Active visitors" value={String(MOCK_AGENT.stats.visitorsInsured)} hint="Currently in country" icon={Users} />
          <StatTile label="Nationalities" value={String(countries)} hint="Among your active visitors" icon={Globe2} />
          <StatTile label="Cover ending this week" value="3" hint="Renewal opportunity" icon={ShieldCheck} />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Currently insured</CardTitle>
            <CardDescription>Live policies attributed to {MOCK_AGENT.agentCode}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {VISITORS.map((v) => (
                <div
                  key={v.policy}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/60 px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {v.name} <span className="font-normal text-stone-400">· {v.country}</span>
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-stone-400">{v.policy}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge variant="success">{v.activity}</Badge>
                    <p className="mt-1 text-xs text-stone-500">until {formatDate(v.until)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </DashboardShell>
  );
}
