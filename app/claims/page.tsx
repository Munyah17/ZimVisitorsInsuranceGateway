"use client";

/**
 * Claims — submission simulation + tracking timeline (per UI mockup).
 * Live version: writes a `claims` row; documents/photos to Supabase Storage.
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  CircleCheck,
  Clock,
  FilePlus2,
  FileText,
  Loader2,
  MapPin,
  Paperclip,
  UploadCloud,
} from "lucide-react";
import { motion } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TIMELINE = [
  { label: "Claim submitted", note: "We have received your claim.", done: true, date: "Today" },
  { label: "Under review", note: "Our team is reviewing your documents.", done: true, date: "Today" },
  { label: "Additional information", note: "We may contact you for more details.", done: false, date: "Pending" },
  { label: "Claim decision", note: "You will be notified of the outcome.", done: false, date: "Pending" },
];

export default function ClaimsPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [docs, setDocs] = useState<string[]>([]);
  const [form, setForm] = useState({
    policyNumber: "ZVIG-2026-00001",
    incidentDate: "",
    incidentType: "medical",
    location: "",
    description: "",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const valid =
    form.policyNumber.trim() &&
    form.incidentDate &&
    form.location.trim() &&
    form.description.trim().length > 10;

  const submit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1400);
  };

  const addMockFile = (name: string) =>
    setDocs((d) => (d.includes(name) ? d : [...d, name]));

  if (submitted) {
    return (
      <div className="bg-gradient-to-b from-safari-50/60 to-transparent">
        <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="text-center">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"
            >
              <CircleCheck className="size-9" />
            </motion.span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Claim submitted
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
              Your claim <span className="font-mono font-semibold text-stone-800">ZVIG-C-2026-00045</span>{" "}
              has been received. We&apos;ll email you at every step, and most claims get a
              first response within 24 hours.
            </p>
          </div>

          <Card className="mt-9">
            <CardHeader>
              <CardTitle>Claim tracking</CardTitle>
              <CardDescription>Claim #ZVIG-C-2026-00045 · {form.incidentType} · {form.location}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative ml-3 space-y-7 border-l-2 border-stone-200 pl-7">
                {TIMELINE.map((t) => (
                  <li key={t.label} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[39px] grid size-6 place-items-center rounded-full ring-4 ring-white",
                        t.done ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-400"
                      )}
                    >
                      {t.done ? <Check className="size-3.5" /> : <Clock className="size-3.5" />}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <p className="font-semibold text-stone-900">{t.label}</p>
                      <Badge variant={t.done ? "success" : "outline"}>{t.date}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-stone-500">{t.note}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <div className="mt-8 flex justify-center">
            <Link href="/portal">
              <Button size="lg">
                Back to my portal <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-safari-50/60 to-transparent">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-safari-950 text-sunset-300 shadow-lg">
            <FilePlus2 className="size-7" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Submit a claim
          </h1>
          <p className="mx-auto mt-3 max-w-md text-stone-500">
            Tell us what happened. Have your policy number, receipts and any
            medical reports ready. Photos are fine.
          </p>
        </div>

        <Card className="mt-9">
          <CardContent className="p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="policyNumber">Policy number</Label>
                <Input
                  id="policyNumber"
                  className="font-mono"
                  value={form.policyNumber}
                  onChange={(e) => set("policyNumber", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="incidentDate">Incident date</Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={form.incidentDate}
                  onChange={(e) => set("incidentDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="incidentType">Incident type</Label>
                <Select
                  id="incidentType"
                  value={form.incidentType}
                  onChange={(e) => set("incidentType", e.target.value)}
                >
                  <option value="medical">Medical expense</option>
                  <option value="accident">Accident</option>
                  <option value="travel">Travel disruption</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                  <Input
                    id="location"
                    className="pl-10"
                    placeholder="e.g. Victoria Falls"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">What happened?</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the incident, any treatment received, and costs incurred…"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
            </div>

            {/* Documents & photos (mock upload) */}
            <div className="mt-6">
              <Label>Documents & photos</Label>
              <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => addMockFile("medical-report.pdf")}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/60 px-4 py-7 text-stone-500 transition-colors hover:border-safari-400 hover:text-safari-700"
                >
                  <UploadCloud className="size-6" />
                  <span className="text-sm font-medium">Upload documents</span>
                  <span className="text-xs text-stone-400">PDF, JPG or PNG, up to 10 MB</span>
                </button>
                <button
                  type="button"
                  onClick={() => addMockFile("incident-photo.jpg")}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/60 px-4 py-7 text-stone-500 transition-colors hover:border-safari-400 hover:text-safari-700"
                >
                  <Camera className="size-6" />
                  <span className="text-sm font-medium">Add photos</span>
                  <span className="text-xs text-stone-400">Straight from your phone camera</span>
                </button>
              </div>
              {docs.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {docs.map((d) => (
                    <li
                      key={d}
                      className="flex items-center gap-2.5 rounded-lg bg-stone-50 px-3.5 py-2.5 text-sm text-stone-700"
                    >
                      {d.endsWith(".pdf") ? (
                        <FileText className="size-4 text-safari-600" />
                      ) : (
                        <Paperclip className="size-4 text-safari-600" />
                      )}
                      {d}
                      <Badge variant="success" className="ml-auto">Attached</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button
              className="mt-7 w-full"
              size="lg"
              disabled={!valid || submitting}
              onClick={submit}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Submitting claim…
                </>
              ) : (
                <>Submit claim</>
              )}
            </Button>
            <p className="mt-3 text-center text-xs text-stone-400">
              Claims are triaged by Travelmate Zim and assessed by our licensed
              underwriting partner. You&apos;ll receive updates by email and WhatsApp.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
