"use client";

/**
 * Admin — Settings. Day to day operational preferences.
 * Platform-level configuration lives in the Super Admin console.
 */

import { useState } from "react";
import { Check, Loader2, Save, Settings } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/motion";
import { ADMIN_NAV } from "../nav";
import { cn } from "@/lib/utils";

const INITIAL = [
  { id: "claim_ack", label: "Auto-acknowledge claims", note: "Send an email the moment a claim is received", on: true },
  { id: "agent_approval", label: "Manual agent approval", note: "New agent applications need admin sign-off", on: true },
  { id: "expiry_reminder", label: "Expiry reminders", note: "Nudge visitors 48 hours before cover ends", on: true },
  { id: "daily_digest", label: "Daily operations digest", note: "Summary email at 07:00 CAT", on: false },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        on ? "bg-safari-700" : "bg-stone-300"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
          on ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

export default function AdminSettingsPage() {
  const [prefs, setPrefs] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 900);
  };

  return (
    <DashboardShell
      title="Settings"
      subtitle="Operational preferences for the admin team"
      nav={ADMIN_NAV}
      badge={<Badge className="px-3 py-1.5"><Settings className="size-3.5" /> Operations</Badge>}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn y={16}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Automation</CardTitle>
              <CardDescription>What the platform handles without you</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {prefs.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 hover:bg-stone-50">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{p.label}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{p.note}</p>
                    </div>
                    <Toggle
                      on={p.on}
                      onClick={() =>
                        setPrefs((x) => x.map((y) => (y.id === p.id ? { ...y, on: !y.on } : y)))
                      }
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn y={16} delay={0.06}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Contact points</CardTitle>
              <CardDescription>Where operational alerts are delivered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="opsEmail">Operations email</Label>
                  <Input id="opsEmail" type="email" defaultValue="admin@zvig.co.zw" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="claimsEmail">Claims inbox</Label>
                  <Input id="claimsEmail" type="email" defaultValue="claims@zvig.co.zw" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hotline">Emergency hotline</Label>
                  <Input id="hotline" type="tel" defaultValue="+263 78 000 1111" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <Button onClick={save} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> Save settings
                    </>
                  )}
                </Button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <Check className="size-4" /> Saved
                  </span>
                )}
              </div>
              <p className="mt-5 rounded-xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-500">
                Feature flags, payment gateways, products and user roles are
                managed by the platform owner in the Super Admin console.
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </DashboardShell>
  );
}
