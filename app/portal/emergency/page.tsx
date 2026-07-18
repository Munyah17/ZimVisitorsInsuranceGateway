"use client";

/**
 * Client Portal — Emergency Help. Hotline plus one-tap assistance actions.
 */

import {
  Ambulance,
  CircleAlert,
  Compass,
  Headset,
  HeartPulse,
  Hospital,
  Phone,
  MessageCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { MOCK_CUSTOMER } from "@/lib/mock-data";
import { CLIENT_NAV } from "../nav";

const EMERGENCY = [
  { icon: HeartPulse, label: "Medical Emergency", note: "Direct line to our medical team" },
  { icon: Ambulance, label: "Ambulance Service", note: "MARS dispatch nationwide" },
  { icon: Hospital, label: "Nearest Hospital", note: "Directions to partner facilities" },
  { icon: Compass, label: "Travel Assistance", note: "Lost documents, disruptions" },
  { icon: CircleAlert, label: "Report Incident", note: "Start a claim record now" },
  { icon: Headset, label: "Contact Support", note: "Anything else, any time" },
];

export default function EmergencyPage() {
  const { policy } = MOCK_CUSTOMER;

  return (
    <DashboardShell
      title="Emergency assistance"
      subtitle="We are here to help, 24 hours a day, 7 days a week"
      nav={CLIENT_NAV}
      badge={<Badge variant="destructive" className="px-3 py-1.5">24/7 line open</Badge>}
    >
      <FadeIn y={16}>
        <a
          href={`tel:${policy.emergencyPhone.replace(/\s/g, "")}`}
          className="flex items-center justify-between gap-4 rounded-2xl bg-red-600 px-6 py-6 text-white shadow-lg shadow-red-600/25 transition-colors hover:bg-red-700"
        >
          <span className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-full bg-white/15">
              <Phone className="size-6" />
            </span>
            <span>
              <span className="block text-xs font-medium uppercase tracking-wider text-red-100">
                Call emergency hotline
              </span>
              <span className="block text-xl font-bold tracking-tight sm:text-3xl">
                {policy.emergencyPhone}
              </span>
            </span>
          </span>
          <span className="hidden text-xs text-red-100 sm:block">Available 24/7</span>
        </a>
      </FadeIn>

      <FadeIn y={16}>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EMERGENCY.map((e) => (
            <button
              key={e.label}
              className="flex items-start gap-3.5 rounded-2xl border border-stone-200 bg-white p-5 text-left transition-all hover:border-red-300 hover:bg-red-50"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
                <e.icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-stone-900">{e.label}</span>
                <span className="mt-0.5 block text-xs text-stone-500">{e.note}</span>
              </span>
            </button>
          ))}
        </div>
      </FadeIn>

      <FadeIn y={16}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Prefer WhatsApp?</CardTitle>
            <CardDescription>
              Message us and a human responds within minutes, day or night.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="https://wa.me/263780001111?text=EMERGENCY"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
            >
              <MessageCircle className="size-4" />
              Open WhatsApp chat
            </a>
          </CardContent>
        </Card>
      </FadeIn>
    </DashboardShell>
  );
}
