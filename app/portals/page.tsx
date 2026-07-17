import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  ServerCog,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

export const metadata: Metadata = {
  title: "Portals",
  description: "Sign in to your Zimbabwe Visitor Insurance Gateway portal.",
};

const PORTALS = [
  {
    href: "/portal",
    icon: UserRound,
    title: "Client Portal",
    who: "Visitors & policyholders",
    body: "View your active policy, download your certificate, reach emergency assistance and submit claims.",
  },
  {
    href: "/agent",
    icon: Briefcase,
    title: "Agent Portal",
    who: "Travel agents · tour operators · hotels",
    body: "Sell cover to walk-in visitors, track policies sold and monitor your commission statement.",
  },
  {
    href: "/admin",
    icon: ShieldCheck,
    title: "Admin Command Centre",
    who: "ZVIG operations team",
    body: "Live policy issuance, revenue, claims queue, agent performance and partner management.",
  },
  {
    href: "/sysadmin",
    icon: ServerCog,
    title: "System Admin Console",
    who: "Platform owner — full control",
    body: "Feature flags, payment gateways, products & pricing, users & roles, API keys, audit and system health.",
  },
];

export default function PortalsPage() {
  return (
    <div className="bg-gradient-to-b from-safari-50/60 to-transparent">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <FadeIn>
          <div className="text-center">
            <Badge className="px-3 py-1">Demo mode — no login required yet</Badge>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Choose your portal
            </h1>
            <p className="mx-auto mt-3 max-w-md text-stone-500">
              One platform, four workspaces. Live version signs you in with
              Supabase Auth and routes you by role automatically.
            </p>
          </div>
        </FadeIn>

        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2">
          {PORTALS.map((p) => (
            <StaggerItem key={p.href} className="h-full">
              <Link
                href={p.href}
                className="group flex h-full flex-col rounded-2xl border border-stone-200/80 bg-white p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-safari-300 hover:shadow-lg hover:shadow-safari-900/5"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-safari-950 text-sunset-300">
                  <p.icon className="size-6" />
                </span>
                <h2 className="mt-5 text-lg font-bold text-stone-900">{p.title}</h2>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-safari-600">
                  {p.who}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-500">{p.body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-safari-700 transition-colors group-hover:text-sunset-600">
                  Enter portal
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeIn>
          <div className="mt-10 text-center">
            <p className="text-sm text-stone-500">
              Just visiting?{" "}
              <Link href="/quote" className="font-semibold text-safari-700 underline-offset-2 hover:underline">
                Get covered in under 3 minutes
              </Link>
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
