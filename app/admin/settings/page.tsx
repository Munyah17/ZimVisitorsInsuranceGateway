"use client";

/**
 * Admin — Settings. Contact points shown to operations staff.
 * Platform-level configuration lives in the Super Admin console.
 * Read-only: there is no live settings store yet, so nothing here
 * pretends to save.
 */

import { Settings } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/motion";
import { ADMIN_NAV } from "../nav";

export default function AdminSettingsPage() {
  return (
    <DashboardShell
      title="Settings"
      subtitle="Operational contact points for the admin team"
      nav={ADMIN_NAV}
      badge={<Badge className="px-3 py-1.5"><Settings className="size-3.5" /> Operations</Badge>}
    >
      <FadeIn y={16}>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Contact points</CardTitle>
            <CardDescription>Where operational alerts are delivered</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="hotline">Emergency hotline</Label>
                <Input id="hotline" type="tel" defaultValue="+263 78 000 1111" disabled />
              </div>
            </div>
            <p className="mt-5 rounded-xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-500">
              Feature flags, payment gateways, products and user roles are
              managed by the platform owner in the Super Admin console.
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </DashboardShell>
  );
}
