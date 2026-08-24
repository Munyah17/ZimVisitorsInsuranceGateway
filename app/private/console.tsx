"use client";

/**
 * Super Admin Console (hidden at /private, never linked publicly).
 * Every section reads real Supabase data via /api/private/overview and
 * /api/private/admin-data (both gated by the /private session cookie).
 * Sections with no real backing anywhere in the app (feature-flag
 * enforcement, SMS delivery, partner API keys, third-party integrations)
 * have been removed rather than shown as decorative, non-functional UI.
 */

import { useEffect, useState } from "react";
import {
  Activity,
  Building2,
  CircleCheck,
  FileClock,
  FileText,
  Globe2,
  Handshake,
  LayoutDashboard,
  Loader2,
  Package,
  Settings,
  ShieldAlert,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell, StatTile, type NavItem } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/motion";
import type { AdminOverview } from "@/lib/admin-overview";
import { cn, formatRelativeTime, formatUSD } from "@/lib/utils";
import { ServicePartnersSection } from "./service-partners-section";
import { ProductPlansSection } from "./product-plans-section";
import { CountriesModal } from "@/components/countries-modal";

type SectionId =
  | "overview"
  | "payments"
  | "products"
  | "users"
  | "organizations"
  | "partners"
  | "audit"
  | "health"
  | "settings";

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "products", label: "Products & Pricing", icon: Package },
  { id: "users", label: "Users & Roles", icon: Users },
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "partners", label: "Service Partners", icon: Handshake },
  { id: "audit", label: "Audit Logs", icon: FileClock },
  { id: "health", label: "System Health", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

interface AdminData {
  users: { name: string; email: string; role: string }[];
  organizations: { name: string; type: string; license: string; status: string }[];
  auditLog: { who: string; what: string; when: string }[];
  gateways: { name: string; region: string; status: string }[];
  services: { name: string; ok: boolean }[];
}

export function SuperAdminConsole() {
  const [section, setSection] = useState<SectionId>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [showCountries, setShowCountries] = useState(false);

  useEffect(() => {
    fetch("/api/private/overview")
      .then((r) => r.json())
      .then((data) => setOverview("metrics" in data ? data : null))
      .catch(() => setOverview(null));
    fetch("/api/private/admin-data")
      .then((r) => r.json())
      .then((data) => setAdminData("users" in data ? data : null))
      .catch(() => setAdminData(null));
  }, []);

  const current = SECTIONS.find((s) => s.id === section)!;

  const nav: NavItem[] = SECTIONS.map((s) => ({
    label: s.label,
    icon: s.icon,
    onClick: () => setSection(s.id),
    active: section === s.id,
  }));

  /* ---------- Reusable section cards ---------- */

  const businessKpiRow = !overview ? (
    <div className="flex justify-center py-10 text-stone-400">
      <Loader2 className="size-6 animate-spin" />
    </div>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile accent label="Policies today" value={String(overview.metrics.policiesToday)} hint="Since midnight" icon={FileText} />
      <StatTile label="Revenue today" value={formatUSD(overview.metrics.revenueToday)} hint="Gross written premium" icon={Wallet} />
      <StatTile label="Open claims" value={String(overview.metrics.openClaims)} hint="Awaiting action now" icon={ShieldAlert} />
      <StatTile
        label="Countries covered"
        value={String(overview.metrics.countriesCovered)}
        hint="Visitor nationalities · view all"
        icon={Globe2}
        onClick={() => setShowCountries(true)}
      />
      <StatTile label="Visitors (YTD)" value={overview.metrics.visitorsYtd.toLocaleString()} hint={`Since 1 Jan ${new Date().getFullYear()}`} icon={Users} />
      <StatTile label="Claims (YTD)" value={String(overview.metrics.claimsYtd)} hint={`Filed since 1 Jan ${new Date().getFullYear()}`} icon={ShieldAlert} />
      <StatTile label="Commission liability (YTD)" value={formatUSD(overview.metrics.commissionLiabilityYtd)} hint="Accrued, not yet paid" icon={Wallet} />
      <StatTile label="Active agents" value={String(overview.agents.filter((a) => a.status === "active").length)} hint={`${overview.agents.length} on the roster`} icon={Building2} />
    </div>
  );

  const gatewaysCard = (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Payment gateways</CardTitle>
        <CardDescription>Rails actually wired into checkout</CardDescription>
      </CardHeader>
      <CardContent>
        {!adminData ? (
          <div className="flex justify-center py-8 text-stone-400"><Loader2 className="size-5 animate-spin" /></div>
        ) : (
          <ul className="space-y-1">
            {adminData.gateways.map((g) => (
              <li
                key={g.name}
                className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-stone-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900">{g.name}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{g.region}</p>
                </div>
                <Badge variant={g.status === "Live" ? "success" : "outline"}>{g.status}</Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-stone-400">
          Gateway keys are stored server side in Vercel environment variables
          and never reach the browser.
        </p>
      </CardContent>
    </Card>
  );

  const productsCard = <ProductPlansSection />;

  const usersCard = (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Users & roles</CardTitle>
        <CardDescription>Every account across all portals</CardDescription>
      </CardHeader>
      <CardContent>
        {!adminData ? (
          <div className="flex justify-center py-8 text-stone-400"><Loader2 className="size-5 animate-spin" /></div>
        ) : adminData.users.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">No accounts yet.</p>
        ) : (
          <ul className="max-h-[520px] space-y-1 overflow-y-auto">
            {adminData.users.map((u) => (
              <li
                key={u.email}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-stone-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">{u.name}</p>
                  <p className="truncate text-xs text-stone-500">{u.email}</p>
                </div>
                <Badge variant="outline">{u.role}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  const orgsCard = (
    <Card>
      <CardHeader>
        <CardTitle>Organizations</CardTitle>
        <CardDescription>Every corporate entity in the ecosystem</CardDescription>
      </CardHeader>
      <CardContent>
        {!adminData ? (
          <div className="flex justify-center py-8 text-stone-400"><Loader2 className="size-5 animate-spin" /></div>
        ) : adminData.organizations.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">No organizations yet.</p>
        ) : (
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
                {adminData.organizations.map((o) => (
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
  );

  const healthCard = (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>System health</CardTitle>
        <CardDescription>Live checks against each real dependency</CardDescription>
      </CardHeader>
      <CardContent>
        {!adminData ? (
          <div className="flex justify-center py-8 text-stone-400"><Loader2 className="size-5 animate-spin" /></div>
        ) : (
          <ul className="space-y-1">
            {adminData.services.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={cn("size-2 shrink-0 rounded-full", s.ok ? "bg-emerald-500" : "bg-stone-300")} />
                  <span className="truncate text-sm font-medium text-stone-800">{s.name}</span>
                </span>
                <span className="shrink-0 text-xs text-stone-400">{s.ok ? "Connected" : "Not configured"}</span>
              </li>
            ))}
          </ul>
        )}
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
        {!adminData ? (
          <div className="flex justify-center py-8 text-stone-400"><Loader2 className="size-5 animate-spin" /></div>
        ) : adminData.auditLog.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">No activity recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {(limit ? adminData.auditLog.slice(0, limit) : adminData.auditLog).map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-safari-500" />
                <div className="min-w-0">
                  <p className="text-sm text-stone-800">{a.what}</p>
                  <p className="mt-0.5 text-xs text-stone-400">
                    {a.who} · {formatRelativeTime(a.when)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  const settingsCard = (
    <Card>
      <CardHeader>
        <CardTitle>Platform identity</CardTitle>
        <CardDescription>Shown across certificates, the site footer and support channels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="siteName">Platform name</Label>
            <Input id="siteName" defaultValue="Zim Travelmate" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp / emergency line</Label>
            <Input id="whatsapp" type="tel" defaultValue="+263 78 000 1111" disabled />
          </div>
        </div>
        <p className="mt-4 text-xs text-stone-400">
          Changing these requires a code change and redeploy — there is no
          live settings store yet.
        </p>
      </CardContent>
    </Card>
  );

  /* ---------- Section layouts ---------- */

  const body: Record<SectionId, React.ReactNode> = {
    overview: (
      <>
        {businessKpiRow}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {healthCard}
          {auditCard(5)}
        </div>
      </>
    ),
    payments: gatewaysCard,
    products: productsCard,
    users: usersCard,
    organizations: orgsCard,
    partners: <ServicePartnersSection />,
    audit: auditCard(),
    health: healthCard,
    settings: settingsCard,
  };

  return (
    <DashboardShell
      title="Super Admin Console"
      subtitle={current.label}
      nav={nav}
      badge={
        <Badge variant="success" className="px-3 py-1.5">
          <Activity className="size-3.5" /> Live data
        </Badge>
      }
    >
      <FadeIn key={section} y={12}>
        {body[section]}
      </FadeIn>
      <CountriesModal
        open={showCountries}
        onClose={() => setShowCountries(false)}
        countries={overview?.policiesByCountry ?? []}
      />
    </DashboardShell>
  );
}
