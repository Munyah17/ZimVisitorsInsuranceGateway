"use client";

/**
 * Super Admin Console (hidden at /super-admin, never linked publicly).
 * Platform-owner workspace with total control. The sidebar switches
 * between sections client side so the whole console stays behind the
 * single passcode gate.
 *
 * Live version: role = 'super_admin' guarded by RLS + middleware; toggles
 * persist to a `platform_settings` table.
 */

import { useState } from "react";
import {
  Activity,
  Building2,
  ChartNoAxesColumn,
  CircleCheck,
  Database,
  FileClock,
  Flag,
  KeyRound,
  LayoutDashboard,
  Package,
  Save,
  ServerCog,
  Settings,
  ShieldCheck,
  TriangleAlert,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell, StatTile, type NavItem } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/motion";
import { PRODUCTS } from "@/lib/mock-data";
import { cn, formatUSD } from "@/lib/utils";

type SectionId =
  | "overview"
  | "flags"
  | "payments"
  | "products"
  | "users"
  | "organizations"
  | "apikeys"
  | "audit"
  | "health"
  | "settings";

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "flags", label: "Feature Flags", icon: Flag },
  { id: "payments", label: "Payments Config", icon: Wallet },
  { id: "products", label: "Products & Pricing", icon: Package },
  { id: "users", label: "Users & Roles", icon: Users },
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "apikeys", label: "API Keys", icon: KeyRound },
  { id: "audit", label: "Audit Logs", icon: FileClock },
  { id: "health", label: "System Health", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

const INITIAL_FLAGS = [
  { id: "web_sales", label: "Web sales channel", desc: "Quote wizard + checkout on the public site", on: true },
  { id: "whatsapp_bot", label: "WhatsApp bot channel", desc: "Purchases and verification via WhatsApp Cloud API", on: false },
  { id: "agent_signup", label: "Agent self-registration", desc: "Let hotels and operators apply for agent accounts", on: true },
  { id: "adventure_rider", label: "Adventure Rider product", desc: "High-risk activities cover (partner insurer)", on: true },
  { id: "public_verify_api", label: "Public verification API", desc: "GET /api/policy/{number} for borders & airlines", on: true },
  { id: "auto_cert_email", label: "Auto certificate email", desc: "Send PDF certificate on payment success", on: true },
  { id: "fraud_monitor", label: "Fraud monitoring", desc: "Pattern scans on issuance & claims", on: true },
  { id: "maintenance", label: "Maintenance mode", desc: "Take the public site offline (admins keep access)", on: false, danger: true },
];

const GATEWAYS = [
  { name: "Stripe", region: "International cards", mode: "Live", enabled: true },
  { name: "PayPal", region: "International wallets", mode: "Live", enabled: true },
  { name: "Paynow", region: "Zimbabwe", mode: "Sandbox", enabled: true },
  { name: "EcoCash", region: "Zimbabwe mobile money", mode: "Sandbox", enabled: false },
  { name: "Adyen", region: "International cards", mode: "Not configured", enabled: false },
];

const USERS = [
  { name: "Munya M.", email: "mmuzvi@gmail.com", role: "Super Admin", badge: "dark" as const },
  { name: "Rufaro Chikwava", email: "admin@zvig.co.zw", role: "Admin", badge: "default" as const },
  { name: "Tendai Moyo", email: "tendai@shearwater.co.zw", role: "Agent", badge: "info" as const },
  { name: "Chipo Nyathi", email: "support@zvig.co.zw", role: "Support", badge: "outline" as const },
  { name: "John Smith", email: "john.smith@example.com", role: "Customer", badge: "outline" as const },
];

const ORGS = [
  { name: "Hola Amigo Multiple Agent", type: "Multiple agent", license: "IPEC-MA-2026-041", status: "active" },
  { name: "Horizon Microinsurance Company", type: "Microinsurer", license: "IPEC-MI-2024-007", status: "active" },
  { name: "Savanna Specialty Insurers", type: "Partner insurer", license: "IPEC-IN-2023-019", status: "active" },
  { name: "Victoria Falls Private Hospital", type: "Hospital", license: "HSP-2032-778", status: "active" },
  { name: "MARS Ambulance Zimbabwe", type: "Ambulance service", license: "AMB-2031-114", status: "active" },
  { name: "Shearwater Adventures", type: "Tourism operator", license: "TMO-2030-556", status: "active" },
  { name: "Kariba Houseboats", type: "Tourism operator", license: "TMO-2033-102", status: "pending_approval" },
];

const API_KEYS = [
  { name: "Air Zimbabwe", key: "zvig_live_••••••••a1b2", scopes: "verify", status: "Active" },
  { name: "ZTA Visa System", key: "zvig_live_••••••••c3d4", scopes: "verify, read", status: "Active" },
  { name: "Safari Connect", key: "zvig_live_••••••••e5f6", scopes: "quote, create", status: "Active" },
  { name: "University of Zimbabwe", key: "zvig_test_••••••••g7h8", scopes: "quote", status: "Test" },
];

const SERVICES = [
  { name: "Web application (Netlify)", ok: true, note: "42 ms p50" },
  { name: "Supabase PostgreSQL", ok: true, note: "12 ms p50" },
  { name: "Supabase Auth", ok: true, note: "Operational" },
  { name: "Storage (certificates & claims)", ok: true, note: "Operational" },
  { name: "Payment webhooks", ok: true, note: "Last event 2 min ago" },
  { name: "WhatsApp webhook", ok: false, note: "Channel disabled" },
  { name: "Email delivery", ok: true, note: "99.4% delivered (7d)" },
];

const AUDIT = [
  { who: "system", what: "payment.succeeded → policy ZVIG-2026-01847 activated", when: "2 min ago" },
  { who: "admin@zvig.co.zw", what: "claim ZVIG-C-2026-0006 → under_review", when: "26 min ago" },
  { who: "mmuzvi@gmail.com", what: "feature flag agent_signup enabled", when: "1 h ago" },
  { who: "tendai@shearwater.co.zw", what: "quote ZVIG-Q-2026-000871 created (agent)", when: "2 h ago" },
  { who: "system", what: "nightly reconciliation: 0 mismatches across 3 gateways", when: "6 h ago" },
  { who: "mmuzvi@gmail.com", what: "product Zimbabwe Visitor Plus price updated", when: "1 d ago" },
  { who: "system", what: "backup completed: 1.2 GB snapshot stored", when: "1 d ago" },
  { who: "admin@zvig.co.zw", what: "agent AGT-0004 approved", when: "2 d ago" },
];

function Toggle({ on, danger, onClick }: { on: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        on ? (danger ? "bg-red-600" : "bg-safari-700") : "bg-stone-300"
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

export function SuperAdminConsole() {
  const [section, setSection] = useState<SectionId>("overview");
  const [flags, setFlags] = useState(INITIAL_FLAGS);
  const [gateways, setGateways] = useState(GATEWAYS);

  const toggleFlag = (id: string) =>
    setFlags((f) => f.map((x) => (x.id === id ? { ...x, on: !x.on } : x)));
  const toggleGateway = (name: string) =>
    setGateways((g) => g.map((x) => (x.name === name ? { ...x, enabled: !x.enabled } : x)));

  const maintenance = flags.find((f) => f.id === "maintenance")?.on;
  const current = SECTIONS.find((s) => s.id === section)!;

  const nav: NavItem[] = SECTIONS.map((s) => ({
    label: s.label,
    icon: s.icon,
    onClick: () => setSection(s.id),
    active: section === s.id,
  }));

  /* ---------- Reusable section cards ---------- */

  const kpiRow = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatTile accent label="Uptime (30d)" value="99.98%" hint="SLA target 99.9%" icon={ServerCog} />
      <StatTile label="API calls today" value="18.4k" hint="All channels" icon={ChartNoAxesColumn} />
      <StatTile label="Active sessions" value="312" hint="Web + portals" icon={Users} />
      <StatTile label="Error rate" value="0.02%" hint="Last 24 h" icon={ShieldCheck} />
      <StatTile label="Database size" value="1.2 GB" hint="Supabase primary" icon={Database} />
    </div>
  );

  const flagsCard = (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Feature flags</CardTitle>
        <CardDescription>Turn platform capabilities on or off in real time</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {flags.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-stone-50"
            >
              <div className="min-w-0">
                <p className={cn("text-sm font-semibold", f.danger ? "text-red-700" : "text-stone-900")}>
                  {f.label}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">{f.desc}</p>
              </div>
              <Toggle on={f.on} danger={f.danger} onClick={() => toggleFlag(f.id)} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  const gatewaysCard = (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Payment gateways</CardTitle>
        <CardDescription>Rails available at checkout, per region</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {gateways.map((g) => (
            <li
              key={g.name}
              className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-stone-50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-stone-900">{g.name}</p>
                  <Badge variant={g.mode === "Live" ? "success" : g.mode === "Sandbox" ? "warning" : "outline"}>
                    {g.mode}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">{g.region}</p>
              </div>
              <Toggle on={g.enabled} onClick={() => toggleGateway(g.name)} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-stone-400">
          Gateway keys are stored server side in Netlify environment variables
          and never reach the browser.
        </p>
      </CardContent>
    </Card>
  );

  const productsCard = (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Products & pricing</CardTitle>
          <CardDescription>The catalogue every channel sells from</CardDescription>
        </div>
        <Button variant="outline" size="sm">Add product</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                <th className="pb-3 pr-4 font-semibold">Product</th>
                <th className="pb-3 pr-4 font-semibold">Category</th>
                <th className="pb-3 pr-4 font-semibold">Underwriter</th>
                <th className="pb-3 pr-4 font-semibold">Day rate</th>
                <th className="pb-3 pr-4 font-semibold">Min premium</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p) => (
                <tr key={p.id} className="border-b border-stone-100 last:border-0">
                  <td className="py-3.5 pr-4 font-medium text-stone-900">{p.name}</td>
                  <td className="py-3.5 pr-4 text-stone-600">{p.category.replaceAll("_", " ")}</td>
                  <td className="py-3.5 pr-4 text-stone-600">{p.providerName}</td>
                  <td className="py-3.5 pr-4 tabular-nums text-stone-900">{formatUSD(p.baseRatePerDayUsd)}/day</td>
                  <td className="py-3.5 pr-4 tabular-nums text-stone-900">{formatUSD(p.minPremiumUsd)}</td>
                  <td className="py-3.5"><Badge variant="success">Active</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const usersCard = (
    <Card className="h-full">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Users & roles</CardTitle>
          <CardDescription>Access control across all portals</CardDescription>
        </div>
        <Button variant="outline" size="sm">Invite user</Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {USERS.map((u) => (
            <li
              key={u.email}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-stone-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-900">{u.name}</p>
                <p className="truncate text-xs text-stone-500">{u.email}</p>
              </div>
              <Badge variant={u.badge}>{u.role}</Badge>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-500">
          Super Admin and Admin are independent roles. Admin runs daily
          operations; only Super Admin can change platform configuration.
        </p>
      </CardContent>
    </Card>
  );

  const orgsCard = (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>Every corporate entity in the ecosystem</CardDescription>
        </div>
        <Button variant="outline" size="sm">Add organization</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                <th className="pb-3 pr-4 font-semibold">Organization</th>
                <th className="pb-3 pr-4 font-semibold">Type</th>
                <th className="pb-3 pr-4 font-semibold">Licence</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {ORGS.map((o) => (
                <tr key={o.name} className="border-b border-stone-100 last:border-0">
                  <td className="py-3.5 pr-4 font-medium text-stone-900">{o.name}</td>
                  <td className="py-3.5 pr-4 text-stone-600">{o.type}</td>
                  <td className="py-3.5 pr-4 font-mono text-xs text-stone-500">{o.license}</td>
                  <td className="py-3.5">
                    <Badge variant={o.status === "active" ? "success" : "warning"}>
                      {o.status === "active" ? "Active" : "Pending"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const apiKeysCard = (
    <Card className="h-full">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Partner API keys</CardTitle>
          <CardDescription>Org-scoped access for airlines, tourism & education</CardDescription>
        </div>
        <Button variant="outline" size="sm">Generate key</Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {API_KEYS.map((k) => (
            <li
              key={k.name}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-stone-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900">{k.name}</p>
                <p className="mt-0.5 font-mono text-xs text-stone-400">{k.key} · {k.scopes}</p>
              </div>
              <Badge variant={k.status === "Active" ? "success" : "warning"}>{k.status}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  const healthCard = (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>System health</CardTitle>
        <CardDescription>Live service status across the stack</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {SERVICES.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className={cn("size-2 shrink-0 rounded-full", s.ok ? "bg-emerald-500" : "bg-stone-300")} />
                <span className="truncate text-sm font-medium text-stone-800">{s.name}</span>
              </span>
              <span className="shrink-0 text-xs text-stone-400">{s.note}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  const auditCard = (limit?: number) => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Audit trail</CardTitle>
        <CardDescription>Append-only record of every material change</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {(limit ? AUDIT.slice(0, limit) : AUDIT).map((a) => (
            <li key={a.what} className="flex items-start gap-3">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-safari-500" />
              <div className="min-w-0">
                <p className="text-sm text-stone-800">{a.what}</p>
                <p className="mt-0.5 text-xs text-stone-400">
                  {a.who} · {a.when}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  const settingsCard = (
    <Card>
      <CardHeader>
        <CardTitle>Platform settings</CardTitle>
        <CardDescription>Identity and global configuration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="siteName">Platform name</Label>
            <Input id="siteName" defaultValue="Hola Amigo Travelmate" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supportEmail">Support email</Label>
            <Input id="supportEmail" type="email" defaultValue="support@zvig.co.zw" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp line</Label>
            <Input id="whatsapp" type="tel" defaultValue="+263 78 000 1111" />
          </div>
        </div>
        <Button className="mt-6">
          <Save className="size-4" /> Save settings
        </Button>
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/60 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-red-800">
            <TriangleAlert className="size-4" /> Danger zone
          </p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-900">Maintenance mode</p>
              <p className="mt-0.5 text-xs text-stone-500">
                Takes the public site offline. Portals stay reachable for staff.
              </p>
            </div>
            <Toggle on={Boolean(maintenance)} danger onClick={() => toggleFlag("maintenance")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  /* ---------- Section layouts ---------- */

  const body: Record<SectionId, React.ReactNode> = {
    overview: (
      <>
        {kpiRow}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {healthCard}
          {auditCard(5)}
        </div>
      </>
    ),
    flags: <div className="grid gap-6 lg:grid-cols-2">{flagsCard}{gatewaysCard}</div>,
    payments: <div className="grid gap-6 lg:grid-cols-2">{gatewaysCard}{flagsCard}</div>,
    products: productsCard,
    users: <div className="grid gap-6 lg:grid-cols-2">{usersCard}{apiKeysCard}</div>,
    organizations: orgsCard,
    apikeys: <div className="grid gap-6 lg:grid-cols-2">{apiKeysCard}{usersCard}</div>,
    audit: auditCard(),
    health: (
      <>
        {kpiRow}
        <div className="mt-6">{healthCard}</div>
      </>
    ),
    settings: settingsCard,
  };

  return (
    <DashboardShell
      title="Super Admin Console"
      subtitle={`Hola Amigo Travelmate · ${current.label}`}
      nav={nav}
      badge={
        maintenance ? (
          <Badge variant="destructive" className="px-3 py-1.5">
            <TriangleAlert className="size-3.5" /> Maintenance mode ON
          </Badge>
        ) : (
          <Badge variant="success" className="px-3 py-1.5">
            <Activity className="size-3.5" /> All systems operational
          </Badge>
        )
      }
    >
      <FadeIn key={section} y={12}>
        {body[section]}
      </FadeIn>
    </DashboardShell>
  );
}
