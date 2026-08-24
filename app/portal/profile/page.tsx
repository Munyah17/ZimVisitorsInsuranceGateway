"use client";

/**
 * Client Portal — Profile. Live account details from /api/portal/data;
 * name and phone are editable via PATCH /api/portal/profile. Nationality
 * and passport number are shown read-only — they're captured per-trip at
 * checkout (see lib/payment-gateways/fulfillment.ts), not edited here.
 */

import { useEffect, useState } from "react";
import { Check, Loader2, LockKeyhole, Save } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/motion";
import { CLIENT_NAV } from "../nav";
import { useRoleData } from "@/lib/use-role-data";
import { getSupabase } from "@/lib/supabase";

interface PortalData {
  profile: { name: string; email: string; nationality: string | null; passportNumber: string | null };
}

export default function ProfilePage() {
  const { data, loading } = useRoleData<PortalData>("/api/portal/data");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (data) setName(data.profile.name);
  }, [data]);

  if (loading || !data) {
    return (
      <DashboardShell title="Profile" nav={CLIENT_NAV}>
        <div className="flex justify-center py-24 text-stone-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const { profile } = data;

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("no session");

      const res = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaved(true);
    } catch {
      setError("Could not save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      title="Profile"
      subtitle="Your identity details and preferences"
      nav={CLIENT_NAV}
      badge={<Badge className="px-3 py-1.5">Client account</Badge>}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <FadeIn y={16}>
          <Card className="h-full">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <span className="grid size-16 place-items-center rounded-2xl bg-safari-950 text-xl font-bold text-sunset-300">
                  {profile.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <div>
                  <p className="text-lg font-bold text-stone-900">{profile.name}</p>
                  <p className="text-sm text-stone-500">{profile.email}</p>
                </div>
              </div>
              <dl className="mt-7 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Nationality</dt>
                  <dd className="font-semibold text-stone-900">
                    {profile.nationality ?? "Not yet on file"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Passport</dt>
                  <dd className="font-mono font-semibold text-stone-900">
                    {profile.passportNumber ?? "Not yet on file"}
                  </dd>
                </div>
              </dl>
              <p className="mt-6 flex items-start gap-2 rounded-xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-500">
                <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
                Nationality and passport number are captured when you buy a policy
                and used for policy issuance and border verification.
              </p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn y={16} delay={0.06}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Contact details</CardTitle>
              <CardDescription>Where certificates and updates are sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} disabled />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="+44 7700 900123" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              {error && (
                <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}

              <div className="mt-6 flex items-center gap-3">
                <Button onClick={save} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> Save changes
                    </>
                  )}
                </Button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <Check className="size-4" /> Saved
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </DashboardShell>
  );
}
