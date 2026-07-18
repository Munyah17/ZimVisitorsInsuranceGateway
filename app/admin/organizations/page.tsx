"use client";

/**
 * Admin — Organizations. Every corporate entity in the ecosystem.
 */

import { Building2, Hospital, Plus, Landmark } from "lucide-react";
import { DashboardShell, StatTile } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { ADMIN_NAV } from "../nav";

const ORGS = [
  { name: "Hola Amigo Multiple Agent", type: "Multiple agent", license: "IPEC-MA-2026-041", status: "active" },
  { name: "Horizon Microinsurance Company", type: "Microinsurer", license: "IPEC-MI-2024-007", status: "active" },
  { name: "Savanna Specialty Insurers", type: "Partner insurer", license: "IPEC-IN-2023-019", status: "active" },
  { name: "Victoria Falls Private Hospital", type: "Hospital", license: "HSP-2032-778", status: "active" },
  { name: "MARS Ambulance Zimbabwe", type: "Ambulance service", license: "AMB-2031-114", status: "active" },
  { name: "Shearwater Adventures", type: "Tourism operator", license: "TMO-2030-556", status: "active" },
  { name: "Wild Horizons", type: "Tourism operator", license: "TMO-2030-561", status: "active" },
  { name: "Kariba Houseboats", type: "Tourism operator", license: "TMO-2033-102", status: "pending_approval" },
];

export default function AdminOrganizationsPage() {
  const pending = ORGS.filter((o) => o.status === "pending_approval").length;

  return (
    <DashboardShell
      title="Organizations"
      subtitle="Insurers, hospitals, ambulances and tourism partners"
      nav={ADMIN_NAV}
      badge={
        <Button variant="accent">
          <Plus className="size-4" /> Add organization
        </Button>
      }
    >
      <FadeIn y={16}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile accent label="Partner organizations" value={String(ORGS.length)} hint={`${pending} pending approval`} icon={Building2} />
          <StatTile label="Licensed insurers" value="2" hint="1 primary + 1 specialist" icon={Landmark} />
          <StatTile label="Care network" value="14" hint="Hospitals and clinics accepting cover" icon={Hospital} />
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Directory</CardTitle>
            <CardDescription>Regulatory licences are shown on certificates and audits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                    <th className="pb-3 pr-4 font-semibold">Organization</th>
                    <th className="pb-3 pr-4 font-semibold">Type</th>
                    <th className="pb-3 pr-4 font-semibold">Licence</th>
                    <th className="pb-3 pr-4 font-semibold">Status</th>
                    <th className="pb-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {ORGS.map((o) => (
                    <tr key={o.name} className="border-b border-stone-100 last:border-0">
                      <td className="py-3.5 pr-4 font-medium text-stone-900">{o.name}</td>
                      <td className="py-3.5 pr-4 text-stone-600">{o.type}</td>
                      <td className="py-3.5 pr-4 font-mono text-xs text-stone-500">{o.license}</td>
                      <td className="py-3.5 pr-4">
                        <Badge variant={o.status === "active" ? "success" : "warning"}>
                          {o.status === "active" ? "Active" : "Pending"}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-right">
                        <Button variant="outline" size="sm">Manage</Button>
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
