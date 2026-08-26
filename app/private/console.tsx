"use client";

/**
 * Super Admin Console (hidden at /private, never linked publicly).
 *
 * Every section that has a real backing table (Products, Service Partners,
 * Users & Roles, Organizations, Policies, Claims, Audit Logs) reads and
 * writes real Supabase data. Sections with no backing table yet (API Keys,
 * Integrations, Messaging, Feature Flags, Payment Gateways beyond Paynow)
 * are kept — the business asked for the structure to stay so the app's
 * shape is visible — but show a real, honest "not connected yet" state
 * instead of fabricated rows or numbers. Nothing on this page claims to
 * work when it doesn't.
 */

import { useEffect, useState } from "react";
import {
  Activity,
  Building2,
  CircleCheck,
  Flag,
  FileClock,
  FileText,
  Globe2,
  Handshake,
  KeyRound,
  LayoutDashboard,
  Loader2,
  MessageSquareText,
  Package,
  Plug,
  Save,
  Send,
  Settings,
  ShieldAlert,
  TriangleAlert,
  UserCog,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell, StatTile, type NavItem } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FadeIn } from "@/components/motion";
import type { AdminOverview } from "@/lib/admin-overview";
import { cn, formatDate, formatRelativeTime, formatUSD } from "@/lib/utils";
import { ServicePartnersSection } from "./service-partners-section";
import { ProductPlansSection } from "./product-plans-section";
import { CountriesModal } from "@/components/countries-modal";

type SectionId =
  | "overview"
  | "flags"
  | "payments"
  | "products"
  | "policies"
  | "claims"
  | "users"
  | "staff"
  | "organizations"
  | "partners"
  | "apikeys"
  | "integrations"
  | "messaging"
  | "audit"
  | "health"
  | "settings";

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "flags", label: "Feature Flags", icon: Flag },
  { id: "payments", label: "Payments Config", icon: Wallet },
  { id: "products", label: "Products & Pricing", icon: Package },
  { id: "policies", label: "Policies", icon: FileText },
  { id: "claims", label: "Claims", icon: ShieldAlert },
  { id: "users", label: "User Management", icon: Users },
  { id: "staff", label: "Staff Management", icon: UserCog },
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "partners", label: "Service Partners", icon: Handshake },
  { id: "apikeys", label: "API Keys", icon: KeyRound },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "messaging", label: "Messaging (SMS)", icon: MessageSquareText },
  { id: "audit", label: "Audit Logs", icon: FileClock },
  { id: "health", label: "System Health", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  agent: "Agent",
  admin: "Admin",
  underwriter_staff: "Underwriter Staff",
  support: "Support",
};

const POLICY_STATUS: Record<string, { label: string; variant: "success" | "warning" | "outline" | "destructive" }> = {
  active: { label: "Active", variant: "success" },
  pending_payment: { label: "Pending payment", variant: "warning" },
  expired: { label: "Expired", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  suspended: { label: "Suspended", variant: "outline" },
};

const CLAIM_STATUS: Record<string, { label: string; variant: "success" | "warning" | "info" | "outline" | "destructive" }> = {
  submitted: { label: "Submitted", variant: "info" },
  under_review: { label: "Under review", variant: "warning" },
  forwarded_to_underwriter: { label: "With underwriter", variant: "info" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  paid: { label: "Paid", variant: "success" },
  closed: { label: "Closed", variant: "outline" },
};

/** Only flags for capabilities that actually exist in the codebase — session-local, not yet persisted or enforced. */
const INITIAL_FLAGS = [
  { id: "web_sales", label: "Web sales channel", desc: "Quote wizard + checkout on the public site", on: true },
  { id: "whatsapp_bot", label: "WhatsApp bot channel", desc: "Purchases and verification via WhatsApp Cloud API", on: false },
  { id: "agent_signup", label: "Agent self-registration", desc: "Let hotels and operators apply for agent accounts", on: true },
  { id: "group_travel", label: "Group travel purchases", desc: "A group leader can buy cover for a whole party", on: true },
  { id: "public_verify_api", label: "Public verification API", desc: "GET /api/policy/{number} for borders & airlines", on: true },
  { id: "maintenance", label: "Maintenance mode", desc: "Intended to take the public site offline", on: false, danger: true },
];

const API_KEYS: { name: string; key: string; scopes: string; status: string }[] = [];

interface AdminData {
  customers: { name: string; email: string; role: string }[];
  staff: { name: string; email: string; role: string }[];
  organizations: { name: string; type: string; license: string; status: string }[];
  auditLog: { who: string; what: string; when: string }[];
  gateways: { name: string; region: string; status: string }[];
  services: { name: string; ok: boolean }[];
}

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
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [showCountries, setShowCountries] = useState(false);

  const [policyQuery, setPolicyQuery] = useState("");
  const [claimQuery, setClaimQuery] = useState("");

  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [roleError, setRoleError] = useState("");

  const [smsMessage, setSmsMessage] = useState("");
  const [smsNotice, setSmsNotice] = useState("");
  const [keyNotice, setKeyNotice] = useState("");

  const loadAdminData = () => {
    fetch("/api/private/admin-data")
      .then((r) => r.json())
      .then((data) => setAdminData("customers" in data ? data : null))
      .catch(() => setAdminData(null));
  };

  useEffect(() => {
    fetch("/api/private/overview")
      .then((r) => r.json())
      .then((data) => setOverview("metrics" in data ? data : null))
      .catch(() => setOverview(null));
    loadAdminData();
  }, []);

  const toggleFlag = (id: string) =>
    setFlags((f) => f.map((x) => (x.id === id ? { ...x, on: !x.on } : x)));

  const current = SECTIONS.find((s) => s.id === section)!;
  const maintenance = flags.find((f) => f.id === "maintenance")?.on;

  const nav: NavItem[] = SECTIONS.map((s) => ({
    label: s.label,
    icon: s.icon,
    onClick: () => setSection(s.id),
    active: section === s.id,
  }));

  const startEditRole = (email: string, role: string) => {
    setEditingEmail(email);
    setPendingRole(role);
    setRoleError("");
  };

  const saveRole = async (email: string) => {
    setSavingRole(true);
    setRoleError("");
    try {
      const res = await fetch("/api/private/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: pendingRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRoleError(data.error || "Could not update the role.");
        return;
      }
      setEditingEmail(null);
      loadAdminData();
    } catch {
      setRoleError("Could not update the role.");
    } finally {
      setSavingRole(false);
    }
  };

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

  const flagsCard = (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Feature flags</CardTitle>
        <CardDescription>Session-local toggles — not yet persisted or enforced server side</CardDescription>
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
        <p className="mt-4 rounded-xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-500">
          These reflect real capabilities already in the codebase. Making
          them actually gate behaviour (and persist across sessions) needs a
          settings table — not yet built.
        </p>
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
          Only Paynow has real integration code today. The others are listed
          as roadmap, not falsely shown as connected.
        </p>
      </CardContent>
    </Card>
  );

  const productsCard = <ProductPlansSection />;

  const filteredPolicies = (overview?.recentPolicies ?? []).filter((p) => {
    const q = policyQuery.trim().toLowerCase();
    return !q || p.policyNumber.toLowerCase().includes(q) || p.holder.toLowerCase().includes(q);
  });

  const policiesCard = (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Policy register</CardTitle>
          <CardDescription>Most recent issuances first, across every channel</CardDescription>
        </div>
        <Input
          placeholder="Search policy number or name…"
          value={policyQuery}
          onChange={(e) => setPolicyQuery(e.target.value)}
          className="h-10 w-full sm:w-72"
        />
      </CardHeader>
      <CardContent>
        {!overview ? (
          <div className="flex justify-center py-8 text-stone-400"><Loader2 className="size-5 animate-spin" /></div>
        ) : filteredPolicies.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">No policies match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                  <th className="pb-3 pr-4 font-semibold">Policy</th>
                  <th className="pb-3 pr-4 font-semibold">Holder</th>
                  <th className="pb-3 pr-4 font-semibold">Country</th>
                  <th className="pb-3 pr-4 font-semibold">Premium</th>
                  <th className="pb-3 pr-4 font-semibold">Channel</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((p) => {
                  const s = POLICY_STATUS[p.status] ?? { label: p.status, variant: "outline" as const };
                  return (
                    <tr key={p.policyNumber} className="border-b border-stone-100 last:border-0">
                      <td className="py-3.5 pr-4 font-mono text-xs text-stone-500">{p.policyNumber}</td>
                      <td className="py-3.5 pr-4 font-medium text-stone-900">{p.holder}</td>
                      <td className="py-3.5 pr-4 text-stone-600">{p.country}</td>
                      <td className="py-3.5 pr-4 font-medium tabular-nums text-stone-900">{formatUSD(p.premium)}</td>
                      <td className="py-3.5 pr-4 capitalize text-stone-500">{p.channel}</td>
                      <td className="py-3.5"><Badge variant={s.variant}>{s.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const filteredClaims = (overview?.recentClaims ?? []).filter((c) => {
    const q = claimQuery.trim().toLowerCase();
    return !q || c.claimNumber.toLowerCase().includes(q) || c.holder.toLowerCase().includes(q);
  });

  const claimsCard = (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Claims queue</CardTitle>
          <CardDescription>Newest first. Assessment sits with the underwriter</CardDescription>
        </div>
        <Input
          placeholder="Search claim number or name…"
          value={claimQuery}
          onChange={(e) => setClaimQuery(e.target.value)}
          className="h-10 w-full sm:w-72"
        />
      </CardHeader>
      <CardContent>
        {!overview ? (
          <div className="flex justify-center py-8 text-stone-400"><Loader2 className="size-5 animate-spin" /></div>
        ) : filteredClaims.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">No claims match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                  <th className="pb-3 pr-4 font-semibold">Claim</th>
                  <th className="pb-3 pr-4 font-semibold">Holder</th>
                  <th className="pb-3 pr-4 font-semibold">Type</th>
                  <th className="pb-3 pr-4 font-semibold">Amount</th>
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((c) => {
                  const b = CLAIM_STATUS[c.status] ?? { label: c.status, variant: "outline" as const };
                  return (
                    <tr key={c.claimNumber} className="border-b border-stone-100 last:border-0">
                      <td className="py-3.5 pr-4 font-mono text-xs text-stone-500">{c.claimNumber}</td>
                      <td className="py-3.5 pr-4 font-medium text-stone-900">{c.holder}</td>
                      <td className="py-3.5 pr-4 text-stone-600">{c.type}</td>
                      <td className="py-3.5 pr-4 font-medium tabular-nums text-stone-900">
                        {c.amount !== null ? formatUSD(c.amount) : "—"}
                      </td>
                      <td className="py-3.5 pr-4 text-stone-500">{formatDate(c.date)}</td>
                      <td className="py-3.5"><Badge variant={b.variant}>{b.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const customersCard = (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>User management</CardTitle>
        <CardDescription>Every customer / visitor account</CardDescription>
      </CardHeader>
      <CardContent>
        {!adminData ? (
          <div className="flex justify-center py-8 text-stone-400"><Loader2 className="size-5 animate-spin" /></div>
        ) : adminData.customers.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">No customer accounts yet.</p>
        ) : (
          <ul className="max-h-[560px] space-y-1 overflow-y-auto">
            {adminData.customers.map((u) => (
              <li
                key={u.email}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-stone-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">{u.name}</p>
                  <p className="truncate text-xs text-stone-500">{u.email}</p>
                </div>
                <Badge variant="outline">Customer</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  const staffCard = (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Staff management</CardTitle>
        <CardDescription>Agents, admins, underwriter staff and support — change a role and save</CardDescription>
      </CardHeader>
      <CardContent>
        {!adminData ? (
          <div className="flex justify-center py-8 text-stone-400"><Loader2 className="size-5 animate-spin" /></div>
        ) : adminData.staff.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">No staff accounts yet.</p>
        ) : (
          <>
            {roleError && <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{roleError}</p>}
            <ul className="max-h-[520px] space-y-1 overflow-y-auto">
              {adminData.staff.map((u) => {
                const editing = editingEmail === u.email;
                return (
                  <li
                    key={u.email}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-stone-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-900">{u.name}</p>
                      <p className="truncate text-xs text-stone-500">{u.email}</p>
                    </div>
                    {editing ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <Select
                          value={pendingRole}
                          onChange={(e) => setPendingRole(e.target.value)}
                          className="h-9 w-40 text-xs"
                        >
                          {Object.entries(ROLE_LABELS).map(([id, label]) => (
                            <option key={id} value={id}>{label}</option>
                          ))}
                        </Select>
                        <button
                          type="button"
                          onClick={() => saveRole(u.email)}
                          disabled={savingRole}
                          aria-label="Save role"
                          className="grid size-8 place-items-center rounded-lg text-safari-700 hover:bg-safari-50"
                        >
                          {savingRole ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEmail(null)}
                          aria-label="Cancel"
                          className="grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-stone-100"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditRole(u.email, u.role)}
                        className="shrink-0"
                      >
                        <Badge variant="outline">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
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

  const apiKeysCard = (
    <Card className="h-full">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Partner API keys</CardTitle>
          <CardDescription>Org-scoped access for airlines, tourism & education</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setKeyNotice("Not available yet — this needs an api_keys table before real keys can be issued.")}>
          Generate key
        </Button>
      </CardHeader>
      <CardContent>
        {keyNotice && <p className="mb-4 rounded-xl bg-stone-50 px-4 py-3 text-xs text-stone-500">{keyNotice}</p>}
        {API_KEYS.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            No API keys issued yet — this feature needs a database table
            before keys can be created and revoked for real.
          </p>
        ) : (
          <ul className="space-y-1">
            {API_KEYS.map((k) => (
              <li key={k.name} className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-stone-50">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900">{k.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-stone-400">{k.key} · {k.scopes}</p>
                </div>
                <Badge variant={k.status === "Active" ? "success" : "warning"}>{k.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  const integrationsCard = (
    <Card>
      <CardHeader>
        <CardTitle>System integrations</CardTitle>
        <CardDescription>External systems Zim Travelmate connects to, beyond payments and partner API keys</CardDescription>
      </CardHeader>
      <CardContent>
        {!adminData ? (
          <div className="flex justify-center py-8 text-stone-400"><Loader2 className="size-5 animate-spin" /></div>
        ) : (
          <ul className="space-y-1">
            {[
              { name: "WhatsApp Business Cloud API", category: "Messaging", desc: "Purchases, verification and support over WhatsApp", ok: adminData.services.find((s) => s.name === "WhatsApp bot")?.ok ?? false },
              { name: "SMS Gateway (bulk & transactional)", category: "Messaging", desc: "Thank-you, reminder and alert messages", ok: false },
              { name: "Airline Partner API", category: "Travel", desc: "Airline itinerary lookups for quote pre-fill", ok: false },
              { name: "Immigration / ZTA Verification", category: "Government", desc: "Border and Zimbabwe Tourism Authority policy checks", ok: false },
              { name: "Hospital & Clinic EMR Sync", category: "Healthcare", desc: "Direct billing with partner hospitals on claims", ok: false },
              { name: "Accounting Export (Xero / QuickBooks)", category: "Finance", desc: "Revenue and commission ledger sync", ok: false },
            ].map((i) => (
              <li
                key={i.name}
                className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-stone-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-stone-900">{i.name}</p>
                    <Badge variant="outline">{i.category}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">{i.desc}</p>
                </div>
                <Badge variant={i.ok ? "success" : "outline"}>{i.ok ? "Connected" : "Not connected"}</Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-stone-400">
          New integrations are built as authenticated Next.js API routes /
          Supabase Edge Functions.
        </p>
      </CardContent>
    </Card>
  );

  const messagingCard = (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Automated SMS</CardTitle>
            <CardDescription>Triggers that would fire once a real SMS gateway is connected</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {[
                { label: "Thank-you SMS on purchase", desc: "Sent automatically the moment a policy activates" },
                { label: "Policy lapse reminder", desc: "Sent 48 hours before a policy's cover ends" },
                { label: "Claim status updates", desc: "Sent on every claim status change" },
              ].map((f) => (
                <li key={f.label} className="rounded-xl px-3 py-3">
                  <p className="text-sm font-semibold text-stone-900">{f.label}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{f.desc}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-500">
              No SMS gateway is connected yet — these triggers don&apos;t send
              anything for real until one is.
            </p>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Send SMS</CardTitle>
            <CardDescription>Manual, one-off or bulk, to any recipient group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="smsMessage">Message</Label>
                <Textarea
                  id="smsMessage"
                  placeholder="Type your message…"
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  maxLength={320}
                />
                <p className="text-right text-xs text-stone-400">{smsMessage.length}/320</p>
              </div>
              <Button
                onClick={() => setSmsNotice("Not sent — no SMS gateway is connected yet.")}
                disabled={!smsMessage.trim()}
              >
                <Send className="size-4" />
                Send SMS
              </Button>
              {smsNotice && <p className="text-xs text-stone-500">{smsNotice}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Message log</CardTitle>
          <CardDescription>Automatic and manual sends, most recent first</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-stone-400">
            No messages sent yet — connect an SMS gateway to start sending.
          </p>
        </CardContent>
      </Card>
    </>
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
        <CardTitle>Platform settings</CardTitle>
        <CardDescription>Identity and global configuration</CardDescription>
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
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/60 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-red-800">
            <TriangleAlert className="size-4" /> Danger zone
          </p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-900">Maintenance mode</p>
              <p className="mt-0.5 text-xs text-stone-500">
                Intended to take the public site offline — not yet wired to
                anything that actually blocks requests.
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
        {businessKpiRow}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {healthCard}
          {auditCard(5)}
        </div>
      </>
    ),
    flags: <div className="grid gap-6 lg:grid-cols-2">{flagsCard}{gatewaysCard}</div>,
    payments: <div className="grid gap-6 lg:grid-cols-2">{gatewaysCard}{flagsCard}</div>,
    products: productsCard,
    policies: policiesCard,
    claims: claimsCard,
    users: customersCard,
    staff: staffCard,
    organizations: orgsCard,
    partners: <ServicePartnersSection />,
    apikeys: apiKeysCard,
    integrations: integrationsCard,
    messaging: messagingCard,
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
      <CountriesModal
        open={showCountries}
        onClose={() => setShowCountries(false)}
        countries={overview?.policiesByCountry ?? []}
      />
    </DashboardShell>
  );
}
