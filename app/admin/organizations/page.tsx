"use client";

/**
 * Admin — Organizations. Every corporate entity in the ecosystem. Live
 * data from /api/admin/organizations.
 */

import { Building2, Hospital, Landmark, Loader2 } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { ADMIN_NAV } from "../nav";
import { useRoleData } from "@/lib/use-role-data";

interface OrgData {
  organizations: { name: string; type: string; license: string; status: string }[];
  stats: { total: number; insurers: number; careNetwork: number; pending: number };
}

export default function AdminOrganizationsPage() {
  const { data, loading } = useRoleData<OrgData>("/api/admin/organizations");

  if (loading || !data) {
    return (
      <DashboardShell title="Organizations" nav={ADMIN_NAV}>
        <div className="flex justify-center py-24 text-stone-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const { organizations, stats } = data;

  return (
    <DashboardShell
      title="Organizations"
      subtitle="Insurers, hospitals, ambulances and tourism partners"
      nav={ADMIN_NAV}
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Partner organizations" value={String(stats.total)} hint={`${stats.pending} pending approval`} icon={Building2} />
          <StatTile label="Licensed insurers" value={String(stats.insurers)} hint="Microinsurers + partner insurers" icon={Landmark} />
          <StatTile label="Care network" value={String(stats.careNetwork)} hint="Hospitals and ambulance services" icon={Hospital} />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Directory</CardTitle>
            <CardDescription>Regulatory licences are shown on certificates and audits</CardDescription>
          </CardHeader>
          <CardContent>
            {organizations.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">No organizations yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                      <th className="pb-3 pr-4 font-semibold">Organization</th>
                      <th className="pb-3 pr-4 font-semibold">Type</th>
                      <th className="pb-3 pr-4 font-semibold">Licence</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map((o) => (
                      <tr key={o.name} className="border-b border-stone-100 last:border-0">
                        <td className="py-3.5 pr-4 font-medium text-stone-900">{o.name}</td>
                        <td className="py-3.5 pr-4 capitalize text-stone-600">{o.type}</td>
                        <td className="py-3.5 pr-4 font-mono text-xs text-stone-500">{o.license}</td>
                        <td className="py-3.5">
                          <Badge variant={o.status === "active" ? "success" : "warning"}>
                            {o.status === "active" ? "Active" : o.status.replace(/_/g, " ")}
                          </Badge>
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
