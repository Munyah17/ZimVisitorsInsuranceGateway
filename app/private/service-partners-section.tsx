"use client";

/**
 * Service Partners management — Super Admin console section.
 * Real CRUD against `service_partners` via /api/admin/partners
 * (session-cookie protected, see lib/super-admin-session.ts). Changes made
 * here show up immediately on the public /partners directory and the
 * quote wizard's "near you" panel, both of which read the same table.
 */

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Hospitals & Clinics",
  "Medical Practices",
  "Ambulance Services",
  "Emergency Care",
  "Pharmacies",
];

interface Partner {
  id: string;
  name: string;
  category: string;
  city: string;
  phone: string;
  open_24h: boolean;
  active: boolean;
}

const EMPTY_FORM = { name: "", category: CATEGORIES[0], city: "", phone: "", open24h: false };

export function ServicePartnersSection() {
  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/partners");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load service partners.");
        return;
      }
      setPartners(data.partners);
    } catch {
      setError("Could not load service partners.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add partner.");
        return;
      }
      setForm(EMPTY_FORM);
      setShowAdd(false);
      await load();
    } catch {
      setError("Could not add partner.");
    } finally {
      setSaving(false);
    }
  };

  const toggleField = async (id: string, field: "active" | "open24h", value: boolean) => {
    setBusyId(id);
    try {
      await fetch(`/api/admin/partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this service partner? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Service Partners</CardTitle>
          <CardDescription>
            Clinics, ambulances and emergency care providers shown on the public directory
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAdd((s) => !s)}>
          <Plus className="size-4" /> Add partner
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {showAdd && (
          <form onSubmit={addPartner} className="mb-6 grid gap-4 rounded-2xl border border-stone-200 p-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pName">Name</Label>
              <Input id="pName" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pCategory">Category</Label>
              <Select id="pCategory" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pCity">City</Label>
              <Input id="pCity" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pPhone">Phone</Label>
              <Input id="pPhone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-600 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.open24h}
                onChange={(e) => setForm((f) => ({ ...f, open24h: e.target.checked }))}
                className="size-4 rounded border-stone-300"
              />
              Open 24/7
            </label>
            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Save partner"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {!partners ? (
          <p className="py-8 text-center text-sm text-stone-400">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
                  <th className="pb-3 pr-4 font-semibold">Name</th>
                  <th className="pb-3 pr-4 font-semibold">Category</th>
                  <th className="pb-3 pr-4 font-semibold">City</th>
                  <th className="pb-3 pr-4 font-semibold">Phone</th>
                  <th className="pb-3 pr-4 font-semibold">24/7</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className={cn("border-b border-stone-100 last:border-0", busyId === p.id && "opacity-50")}>
                    <td className="py-3 pr-4 font-medium text-stone-900">{p.name}</td>
                    <td className="py-3 pr-4 text-stone-600">{p.category}</td>
                    <td className="py-3 pr-4 text-stone-600">{p.city}</td>
                    <td className="py-3 pr-4 text-stone-600">{p.phone}</td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => toggleField(p.id, "open24h", !p.open_24h)}
                      >
                        <Badge variant={p.open_24h ? "success" : "outline"}>{p.open_24h ? "Yes" : "No"}</Badge>
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => toggleField(p.id, "active", !p.active)}
                      >
                        <Badge variant={p.active ? "success" : "outline"}>{p.active ? "Active" : "Hidden"}</Badge>
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => remove(p.id)}
                        aria-label={`Remove ${p.name}`}
                        className="text-stone-400 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {partners.length === 0 && (
              <p className="py-8 text-center text-sm text-stone-400">No service partners yet.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
