"use client";

/**
 * Client Portal — Profile. Identity details and communication preferences.
 */

import { useState } from "react";
import { Check, Loader2, LockKeyhole, Mail, MessageCircle, Save } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/motion";
import { MOCK_CUSTOMER } from "@/lib/mock-data";
import { CLIENT_NAV } from "../nav";
import { cn } from "@/lib/utils";

function PrefToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
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

export default function ProfilePage() {
  const [prefs, setPrefs] = useState({ email: true, whatsapp: true, marketing: false });
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
                  {MOCK_CUSTOMER.fullName.split(" ").map((n) => n[0]).join("")}
                </span>
                <div>
                  <p className="text-lg font-bold text-stone-900">{MOCK_CUSTOMER.fullName}</p>
                  <p className="text-sm text-stone-500">{MOCK_CUSTOMER.email}</p>
                </div>
              </div>
              <dl className="mt-7 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Nationality</dt>
                  <dd className="font-semibold text-stone-900">{MOCK_CUSTOMER.nationality}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Passport</dt>
                  <dd className="font-mono font-semibold text-stone-900">{MOCK_CUSTOMER.passportNumber}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Member since</dt>
                  <dd className="font-semibold text-stone-900">Jul 2026</dd>
                </div>
              </dl>
              <p className="mt-6 flex items-start gap-2 rounded-xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-500">
                <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
                Passport details are encrypted and shown masked. They are only used
                for policy issuance and border verification.
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
                  <Input id="fullName" defaultValue={MOCK_CUSTOMER.fullName} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={MOCK_CUSTOMER.email} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" defaultValue="+44 7700 900123" />
                </div>
              </div>

              <h3 className="mt-7 text-sm font-semibold text-stone-900">Notifications</h3>
              <ul className="mt-3 space-y-1">
                {(
                  [
                    { id: "email", icon: Mail, label: "Email updates", note: "Certificates, claims and policy changes" },
                    { id: "whatsapp", icon: MessageCircle, label: "WhatsApp updates", note: "Instant claim status and reminders" },
                    { id: "marketing", icon: Check, label: "Travel tips & offers", note: "Occasional and easy to switch off" },
                  ] as const
                ).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 hover:bg-stone-50">
                    <span className="flex items-center gap-3">
                      <p.icon className="size-4 text-safari-600" />
                      <span>
                        <span className="block text-sm font-semibold text-stone-900">{p.label}</span>
                        <span className="block text-xs text-stone-500">{p.note}</span>
                      </span>
                    </span>
                    <PrefToggle
                      on={prefs[p.id]}
                      onClick={() => setPrefs((x) => ({ ...x, [p.id]: !x[p.id] }))}
                    />
                  </li>
                ))}
              </ul>

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
