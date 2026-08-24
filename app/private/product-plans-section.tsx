"use client";

/**
 * Products & Pricing management — Super Admin console section.
 * Real CRUD against `insurance_products` via /api/admin/products
 * (session-cookie protected). Changes here show up immediately on the
 * landing page, /coverage, the quote wizard and the WhatsApp bot — they
 * all read the same live catalogue now instead of a hardcoded plan.
 */

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatUSD } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  medical: "Medical",
  medical_plus_travel: "Medical + Travel",
  adventure: "Adventure",
  transit: "Transit",
};

interface Product {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string;
  coverage_details: {
    medical_limit_usd?: number;
    emergency_assistance?: boolean;
    accident_cover_usd?: number;
    travel_protection?: boolean;
    safari_assistance?: boolean;
    adventure_activities?: boolean;
    evacuation?: boolean;
    base_rate_per_day_usd?: number;
    min_premium_usd?: number;
  };
  features: string[];
  base_price_usd: number;
  popular: boolean;
  featured: boolean;
  active: boolean;
}

interface FormState {
  name: string;
  tagline: string;
  description: string;
  category: string;
  basePriceUsd: string;
  baseRatePerDayUsd: string;
  minPremiumUsd: string;
  medicalLimitUsd: string;
  accidentCoverUsd: string;
  emergencyAssistance: boolean;
  travelProtection: boolean;
  safariAssistance: boolean;
  adventureActivities: boolean;
  evacuation: boolean;
  featuresText: string;
  popular: boolean;
  featured: boolean;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  tagline: "",
  description: "",
  category: "medical_plus_travel",
  basePriceUsd: "",
  baseRatePerDayUsd: "",
  minPremiumUsd: "",
  medicalLimitUsd: "",
  accidentCoverUsd: "",
  emergencyAssistance: true,
  travelProtection: true,
  safariAssistance: false,
  adventureActivities: false,
  evacuation: true,
  featuresText: "",
  popular: false,
  featured: true,
  active: true,
};

function productToForm(p: Product): FormState {
  const c = p.coverage_details ?? {};
  return {
    name: p.name,
    tagline: p.tagline ?? "",
    description: p.description ?? "",
    category: p.category,
    basePriceUsd: String(p.base_price_usd),
    baseRatePerDayUsd: String(c.base_rate_per_day_usd ?? ""),
    minPremiumUsd: String(c.min_premium_usd ?? ""),
    medicalLimitUsd: String(c.medical_limit_usd ?? ""),
    accidentCoverUsd: String(c.accident_cover_usd ?? ""),
    emergencyAssistance: Boolean(c.emergency_assistance),
    travelProtection: Boolean(c.travel_protection),
    safariAssistance: Boolean(c.safari_assistance),
    adventureActivities: Boolean(c.adventure_activities),
    evacuation: Boolean(c.evacuation),
    featuresText: (p.features ?? []).join("\n"),
    popular: p.popular,
    featured: p.featured,
    active: p.active,
  };
}

function formToPayload(f: FormState) {
  return {
    name: f.name,
    tagline: f.tagline,
    description: f.description,
    category: f.category,
    basePriceUsd: Number(f.basePriceUsd),
    baseRatePerDayUsd: Number(f.baseRatePerDayUsd),
    minPremiumUsd: Number(f.minPremiumUsd),
    medicalLimitUsd: Number(f.medicalLimitUsd),
    accidentCoverUsd: Number(f.accidentCoverUsd),
    emergencyAssistance: f.emergencyAssistance,
    travelProtection: f.travelProtection,
    safariAssistance: f.safariAssistance,
    adventureActivities: f.adventureActivities,
    evacuation: f.evacuation,
    features: f.featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
    popular: f.popular,
    featured: f.featured,
    active: f.active,
  };
}

export function ProductPlansSection() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load products.");
        return;
      }
      setProducts(data.products);
    } catch {
      setError("Could not load products.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm(productToForm(p));
    setFormOpen(true);
  };

  const cancel = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(editingId ? `/api/admin/products/${editingId}` : "/api/admin/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save the plan.");
        return;
      }
      setFormOpen(false);
      setEditingId(null);
      await load();
    } catch {
      setError("Could not save the plan.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: Product) => {
    setBusyId(p.id);
    try {
      await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !p.active }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Products & Pricing</CardTitle>
          <CardDescription>The catalogue every channel sells from — web, WhatsApp and the AI app</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={startAdd}>
          <Plus className="size-4" /> Add product
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {formOpen && (
          <form onSubmit={submit} className="mb-6 space-y-4 rounded-2xl border border-stone-200 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pName">Name</Label>
                <Input id="pName" value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pTagline">Tagline</Label>
                <Input id="pTagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Complete protection for your visit" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pDescription">Description</Label>
              <Textarea id="pDescription" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="pCategory">Category</Label>
                <Select id="pCategory" value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pBasePrice">Premium (USD)</Label>
                <Input id="pBasePrice" type="number" min="0" step="0.01" value={form.basePriceUsd} onChange={(e) => set("basePriceUsd", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pDayRate">Day rate (USD)</Label>
                <Input id="pDayRate" type="number" min="0" step="0.01" value={form.baseRatePerDayUsd} onChange={(e) => set("baseRatePerDayUsd", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pMinPremium">Minimum premium (USD)</Label>
                <Input id="pMinPremium" type="number" min="0" step="0.01" value={form.minPremiumUsd} onChange={(e) => set("minPremiumUsd", e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pMedicalLimit">Medical limit (USD)</Label>
                <Input id="pMedicalLimit" type="number" min="0" step="1" value={form.medicalLimitUsd} onChange={(e) => set("medicalLimitUsd", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pAccidentCover">Accident cover (USD)</Label>
                <Input id="pAccidentCover" type="number" min="0" step="1" value={form.accidentCoverUsd} onChange={(e) => set("accidentCoverUsd", e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {([
                ["emergencyAssistance", "24/7 emergency assistance"],
                ["travelProtection", "Travel protection & delays"],
                ["safariAssistance", "Safari assistance network"],
                ["adventureActivities", "Adventure activities cover"],
                ["evacuation", "Emergency medical evacuation"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="size-4 rounded border-stone-300"
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pFeatures">Features (one per line, shown as bullets on the plan card)</Label>
              <Textarea
                id="pFeatures"
                value={form.featuresText}
                onChange={(e) => set("featuresText", e.target.value)}
                placeholder={"$30,000 medical cover\n24/7 emergency assistance"}
                rows={5}
              />
            </div>

            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input type="checkbox" checked={form.popular} onChange={(e) => set("popular", e.target.checked)} className="size-4 rounded border-stone-300" />
                &quot;Most popular&quot; badge
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 rounded border-stone-300" />
                Show on landing page
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="size-4 rounded border-stone-300" />
                Active (sellable)
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : editingId ? "Save changes" : "Create product"}
              </Button>
              <Button type="button" variant="ghost" onClick={cancel}>Cancel</Button>
            </div>
          </form>
        )}

        {!products ? (
          <p className="py-8 text-center text-sm text-stone-400">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                  <th className="pb-3 pr-4 font-semibold">Product</th>
                  <th className="pb-3 pr-4 font-semibold">Category</th>
                  <th className="pb-3 pr-4 font-semibold">Premium</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={cn("border-b border-stone-100 last:border-0", busyId === p.id && "opacity-50")}>
                    <td className="py-3.5 pr-4">
                      <p className="font-medium text-stone-900">{p.name}</p>
                      {p.tagline && <p className="text-xs text-stone-400">{p.tagline}</p>}
                    </td>
                    <td className="py-3.5 pr-4 text-stone-600">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                    <td className="py-3.5 pr-4 tabular-nums text-stone-900">{formatUSD(p.base_price_usd)}</td>
                    <td className="py-3.5 pr-4">
                      <button type="button" disabled={busyId === p.id} onClick={() => toggleActive(p)}>
                        <Badge variant={p.active ? "success" : "outline"}>{p.active ? "Active" : "Inactive"}</Badge>
                      </button>
                      {p.popular && <Badge variant="dark" className="ml-1.5">Popular</Badge>}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        aria-label={`Edit ${p.name}`}
                        className="text-stone-400 hover:text-safari-700"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <p className="py-8 text-center text-sm text-stone-400">No products yet.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
