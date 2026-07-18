"use client";

/**
 * Insurance Quote Flow — 6-step wizard (mock simulation).
 *
 * Step 1  Traveller details    -> writes `customers` when live
 *         Individual or group: a group leader fills in every traveller.
 * Step 2  Trip & itinerary     -> writes `travel_details`
 *         Includes accommodation, transport and ZTA document uploads.
 * Step 3  Coverage selection   -> reads `insurance_products`
 * Step 4  Premium calculation  -> creates a `quotes` row (Edge Function)
 * Step 5  Checkout simulation  -> creates a `payments` row
 * Step 6  Certificate          -> `policies` row + PDF in Supabase Storage
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Check,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Lock,
  Plane,
  Plus,
  QrCode,
  ShieldCheck,
  Smartphone,
  Trash2,
  UploadCloud,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ACTIVITIES,
  NATIONALITIES,
  PRODUCTS,
  TRAVEL_PURPOSES,
  type ActivityId,
} from "@/lib/mock-data";
import {
  calculatePremium,
  nextPolicyNumber,
  tripDays,
  STAMP_DUTY_RATE,
  ZTA_LEVY_RATE,
} from "@/lib/quote-engine";
import { cn, formatDate, formatUSD } from "@/lib/utils";

const STEPS = [
  "Travellers",
  "Trip & itinerary",
  "Coverage",
  "Your quote",
  "Payment",
  "Certificate",
];

/**
 * Documents the Zimbabwe Tourism Authority expects to accompany visitor
 * cover. Mock uploads for the prototype; live version stores them in
 * Supabase Storage alongside the quote.
 */
const ZTA_DOCS = [
  { id: "itinerary", label: "Travel itinerary", hint: "Flights or road plan" },
  { id: "accommodation", label: "Accommodation booking", hint: "Hotel or lodge confirmation" },
  { id: "return-ticket", label: "Return / onward ticket", hint: "Proof of departure" },
  { id: "bank-statement", label: "Bank statement", hint: "Recent, any currency" },
];

interface Traveller {
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  passportNumber: string;
}

const EMPTY_TRAVELLER: Traveller = {
  fullName: "",
  nationality: "",
  dateOfBirth: "",
  passportNumber: "",
};

interface FormState {
  tripType: "individual" | "group";
  // Group leader (or sole traveller)
  fullName: string;
  nationality: string;
  residenceCountry: string; // optional, only when different from nationality
  passportNumber: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  // Additional group members
  travellers: Traveller[];
  // Trip & itinerary
  arrivalDate: string;
  departureDate: string;
  purpose: string;
  activities: ActivityId[];
  accommodation: string;
  transport: string;
  documents: string[];
  // Coverage & payment
  productId: string;
  paymentMethod: "card" | "paypal" | "mobile";
}

function travellerValid(t: Traveller) {
  return (
    t.fullName.trim().length > 2 &&
    t.nationality &&
    t.dateOfBirth &&
    t.passportNumber.trim().length > 4
  );
}

export function QuoteWizard() {
  const params = useSearchParams();
  const preselected = params.get("product");

  const [step, setStep] = useState(0);
  const [paying, setPaying] = useState(false);
  // Generated on payment success (not during render) so the prerendered
  // HTML and the hydrated client tree always match.
  const [policyNumber, setPolicyNumber] = useState("");
  const [form, setForm] = useState<FormState>({
    tripType: "individual",
    fullName: "",
    nationality: "",
    residenceCountry: "",
    passportNumber: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    travellers: [],
    arrivalDate: "",
    departureDate: "",
    purpose: "tourism",
    activities: ["general"],
    accommodation: "",
    transport: "",
    documents: [],
    productId: preselected && PRODUCTS.some((p) => p.id === preselected)
      ? preselected
      : PRODUCTS[1].id,
    paymentMethod: "card",
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setTraveller = (i: number, patch: Partial<Traveller>) =>
    setForm((f) => ({
      ...f,
      travellers: f.travellers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    }));

  const addTraveller = () =>
    setForm((f) => ({ ...f, travellers: [...f.travellers, { ...EMPTY_TRAVELLER }] }));

  const removeTraveller = (i: number) =>
    setForm((f) => ({ ...f, travellers: f.travellers.filter((_, idx) => idx !== i) }));

  const toggleDoc = (id: string) =>
    setForm((f) => ({
      ...f,
      documents: f.documents.includes(id)
        ? f.documents
        : [...f.documents, id],
    }));

  const product = PRODUCTS.find((p) => p.id === form.productId) ?? PRODUCTS[1];
  const totalTravellers = 1 + (form.tripType === "group" ? form.travellers.length : 0);

  const pricing = useMemo(
    () =>
      calculatePremium({
        product,
        arrivalDate: form.arrivalDate,
        departureDate: form.departureDate,
        dateOfBirths: [
          form.dateOfBirth,
          ...(form.tripType === "group" ? form.travellers.map((t) => t.dateOfBirth) : []),
        ].filter(Boolean),
        activities: form.activities,
      }),
    [product, form.arrivalDate, form.departureDate, form.dateOfBirth, form.travellers, form.tripType, form.activities]
  );

  const days = tripDays(form.arrivalDate, form.departureDate);

  const stepValid = (() => {
    switch (step) {
      case 0: {
        const leaderOk =
          form.fullName.trim().length > 2 &&
          form.nationality &&
          form.passportNumber.trim().length > 4 &&
          form.dateOfBirth &&
          /.+@.+\..+/.test(form.email);
        if (!leaderOk) return false;
        if (form.tripType === "group") {
          return form.travellers.length > 0 && form.travellers.every(travellerValid);
        }
        return true;
      }
      case 1:
        return Boolean(
          form.arrivalDate &&
            form.departureDate &&
            days > 0 &&
            form.activities.length > 0 &&
            form.accommodation.trim()
        );
      case 2:
        return Boolean(form.productId);
      default:
        return true;
    }
  })();

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const simulatePayment = () => {
    setPaying(true);
    setTimeout(() => {
      setPolicyNumber(nextPolicyNumber());
      setPaying(false);
      next();
    }, 1800);
  };

  const toggleActivity = (id: ActivityId) =>
    set(
      "activities",
      form.activities.includes(id)
        ? form.activities.filter((a) => a !== id)
        : [...form.activities, id]
    );

  return (
    <div className="bg-gradient-to-b from-safari-50/60 to-transparent">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-full text-xs font-bold transition-colors",
                      i < step
                        ? "bg-safari-700 text-white"
                        : i === step
                          ? "bg-safari-900 text-white ring-4 ring-safari-100"
                          : "bg-stone-200 text-stone-500"
                    )}
                  >
                    {i < step ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden text-[10px] font-medium sm:block",
                      i === step ? "text-safari-900" : "text-stone-400"
                    )}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 mb-5 h-0.5 flex-1 rounded-full sm:mb-0 sm:-mt-5",
                      i < step ? "bg-safari-600" : "bg-stone-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* ==================== STEP 1: TRAVELLERS ==================== */}
            {step === 0 && (
              <Card>
                <CardContent className="p-7 sm:p-9">
                  <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                    Who&apos;s travelling?
                  </h1>
                  <p className="mt-1.5 text-sm text-stone-500">
                    Names exactly as they appear in each passport. They go on the
                    certificate.
                  </p>

                  {/* Trip type */}
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        { id: "individual", icon: User, label: "Just me", hint: "One traveller, one certificate" },
                        { id: "group", icon: Users, label: "Group travel", hint: "A group leader fills in everyone" },
                      ] as const
                    ).map((t) => {
                      const selected = form.tripType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            set("tripType", t.id);
                            if (t.id === "group" && form.travellers.length === 0) addTraveller();
                          }}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                            selected
                              ? "border-safari-600 bg-safari-50 ring-1 ring-safari-600"
                              : "border-stone-200 bg-white hover:border-stone-300"
                          )}
                        >
                          <t.icon className={cn("mt-0.5 size-5", selected ? "text-safari-700" : "text-stone-400")} />
                          <span>
                            <span className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                              {t.label}
                              {selected && <Check className="size-4 text-safari-700" />}
                            </span>
                            <span className="mt-0.5 block text-xs text-stone-500">{t.hint}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Leader details */}
                  <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-stone-400">
                    {form.tripType === "group" ? "Group leader" : "Your details"}
                  </h2>
                  <div className="mt-3 grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="fullName">Full name</Label>
                      <Input
                        id="fullName"
                        placeholder="e.g. John Smith"
                        value={form.fullName}
                        onChange={(e) => set("fullName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nationality">Nationality (as shown in passport)</Label>
                      <Select
                        id="nationality"
                        value={form.nationality}
                        onChange={(e) => set("nationality", e.target.value)}
                      >
                        <option value="">Select nationality</option>
                        {NATIONALITIES.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="passportNumber">Passport number</Label>
                      <Input
                        id="passportNumber"
                        placeholder="e.g. P123456789"
                        value={form.passportNumber}
                        onChange={(e) => set("passportNumber", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dob">Date of birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => set("dateOfBirth", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="residence">
                        Country of residence{" "}
                        <span className="font-normal text-stone-400">(if different)</span>
                      </Label>
                      <Select
                        id="residence"
                        value={form.residenceCountry}
                        onChange={(e) => set("residenceCountry", e.target.value)}
                      >
                        <option value="">Same as nationality</option>
                        {NATIONALITIES.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+44 7700 900123"
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Group members */}
                  {form.tripType === "group" && (
                    <div className="mt-8">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
                          Travellers in your group ({form.travellers.length})
                        </h2>
                        <Button variant="outline" size="sm" onClick={addTraveller}>
                          <Plus className="size-4" /> Add traveller
                        </Button>
                      </div>
                      <div className="mt-3 space-y-4">
                        {form.travellers.map((t, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-stone-200 bg-stone-50/50 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-safari-700">
                                Traveller {i + 2}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeTraveller(i)}
                                className="grid size-8 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                aria-label={`Remove traveller ${i + 2}`}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                            <div className="mt-2 grid gap-4 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label>Full name</Label>
                                <Input
                                  placeholder="As shown in passport"
                                  value={t.fullName}
                                  onChange={(e) => setTraveller(i, { fullName: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Nationality</Label>
                                <Select
                                  value={t.nationality}
                                  onChange={(e) => setTraveller(i, { nationality: e.target.value })}
                                >
                                  <option value="">Select nationality</option>
                                  {NATIONALITIES.map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                  ))}
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label>Date of birth</Label>
                                <Input
                                  type="date"
                                  value={t.dateOfBirth}
                                  onChange={(e) => setTraveller(i, { dateOfBirth: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Passport number</Label>
                                <Input
                                  placeholder="e.g. P987654321"
                                  value={t.passportNumber}
                                  onChange={(e) => setTraveller(i, { passportNumber: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-stone-400">
                        Every traveller is individually covered and named on the group
                        certificate. One payment covers everyone.
                      </p>
                    </div>
                  )}

                  <p className="mt-6 flex items-center gap-2 text-xs text-stone-400">
                    <Lock className="size-3.5" />
                    Passport details are encrypted and only used for policy issuance and verification.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ==================== STEP 2: TRIP & ITINERARY ==================== */}
            {step === 1 && (
              <Card>
                <CardContent className="p-7 sm:p-9">
                  <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                    Your trip to Zimbabwe
                  </h1>
                  <p className="mt-1.5 text-sm text-stone-500">
                    Dates and activities set your cover period and price. Itinerary
                    details meet Zimbabwe Tourism Authority requirements.
                  </p>
                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="arrival">Arrival date</Label>
                      <Input
                        id="arrival"
                        type="date"
                        value={form.arrivalDate}
                        onChange={(e) => set("arrivalDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="departure">Departure date</Label>
                      <Input
                        id="departure"
                        type="date"
                        min={form.arrivalDate}
                        value={form.departureDate}
                        onChange={(e) => set("departureDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="purpose">Purpose of visit</Label>
                      <Select
                        id="purpose"
                        value={form.purpose}
                        onChange={(e) => set("purpose", e.target.value)}
                      >
                        {TRAVEL_PURPOSES.map((p) => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {days > 0 && (
                    <p className="mt-4 text-sm font-medium text-safari-700">
                      {days} day{days === 1 ? "" : "s"} of cover
                      {totalTravellers > 1 && ` · ${totalTravellers} travellers`}
                      {form.arrivalDate && form.departureDate && (
                        <span className="text-stone-400">
                          {" "}· {formatDate(form.arrivalDate)} to {formatDate(form.departureDate)}
                        </span>
                      )}
                    </p>
                  )}

                  <div className="mt-7">
                    <Label>Planned activities</Label>
                    <div className="mt-2.5 grid gap-3 sm:grid-cols-3">
                      {ACTIVITIES.map((a) => {
                        const selected = form.activities.includes(a.id);
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => toggleActivity(a.id)}
                            className={cn(
                              "rounded-xl border p-4 text-left transition-all",
                              selected
                                ? "border-safari-600 bg-safari-50 ring-1 ring-safari-600"
                                : "border-stone-200 bg-white hover:border-stone-300"
                            )}
                          >
                            <span className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-stone-900">{a.label}</span>
                              {selected && <Check className="size-4 text-safari-700" />}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-stone-500">
                              {a.hint}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Itinerary & ZTA requirements */}
                  <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-stone-400">
                    Itinerary & ZTA requirements
                  </h2>
                  <div className="mt-3 grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="accommodation">Accommodation</Label>
                      <div className="relative">
                        <BedDouble className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                        <Input
                          id="accommodation"
                          className="pl-10"
                          placeholder="e.g. Victoria Falls Hotel"
                          value={form.accommodation}
                          onChange={(e) => set("accommodation", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="transport">
                        Arrival transport{" "}
                        <span className="font-normal text-stone-400">(optional)</span>
                      </Label>
                      <div className="relative">
                        <Plane className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                        <Input
                          id="transport"
                          className="pl-10"
                          placeholder="e.g. Airlink flight 4Z 116, or Beitbridge border"
                          value={form.transport}
                          onChange={(e) => set("transport", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <Label>Supporting documents</Label>
                    <p className="mt-1 text-xs text-stone-400">
                      Requested by the Zimbabwe Tourism Authority. You can also add
                      them later from your portal.
                    </p>
                    <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                      {ZTA_DOCS.map((d) => {
                        const uploaded = form.documents.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleDoc(d.id)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                              uploaded
                                ? "border-emerald-300 bg-emerald-50/60"
                                : "border-dashed border-stone-300 bg-stone-50/60 hover:border-safari-400"
                            )}
                          >
                            {uploaded ? (
                              <FileText className="size-5 shrink-0 text-emerald-600" />
                            ) : (
                              <UploadCloud className="size-5 shrink-0 text-stone-400" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-stone-900">{d.label}</span>
                              <span className="block text-xs text-stone-500">{d.hint}</span>
                            </span>
                            {uploaded && <Badge variant="success">Attached</Badge>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ==================== STEP 3: COVERAGE SELECTION ==================== */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                  Choose your cover
                </h1>
                <p className="mt-1.5 text-sm text-stone-500">
                  Every plan is backed by our licensed Zimbabwean underwriter.
                  {totalTravellers > 1 && ` The plan applies to all ${totalTravellers} travellers.`}
                </p>
                <div className="mt-7 grid gap-4">
                  {PRODUCTS.map((p) => {
                    const selected = form.productId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => set("productId", p.id)}
                        className={cn(
                          "rounded-2xl border bg-white p-6 text-left transition-all",
                          selected
                            ? "border-safari-700 shadow-lg shadow-safari-900/10 ring-1 ring-safari-700"
                            : "border-stone-200 hover:border-stone-300"
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-stone-900">{p.name}</h3>
                              {p.popular && <Badge>Most popular</Badge>}
                            </div>
                            <p className="mt-1 text-sm text-stone-500">{p.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-stone-900">
                              {formatUSD(p.basePriceUsd)}
                              <span className="text-xs font-medium text-stone-400"> from</span>
                            </span>
                            <span
                              className={cn(
                                "grid size-6 place-items-center rounded-full border-2 transition-colors",
                                selected
                                  ? "border-safari-700 bg-safari-700 text-white"
                                  : "border-stone-300"
                              )}
                            >
                              {selected && <Check className="size-3.5" />}
                            </span>
                          </div>
                        </div>
                        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
                          {p.features.slice(0, 4).map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-xs text-stone-600">
                              <Check className="size-3 text-safari-600" /> {f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
                {form.activities.includes("adventure") && product.category !== "adventure" && (
                  <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    You selected adventure activities. The{" "}
                    <strong>Zimbabwe Adventure Rider</strong> covers rafting, bungee and
                    gorge swing.
                  </p>
                )}
              </div>
            )}

            {/* ==================== STEP 4: PREMIUM CALCULATION ==================== */}
            {step === 3 && (
              <Card>
                <CardContent className="p-7 sm:p-9">
                  <h1 className="text-2xl font-bold tracking-tight text-stone-900">Your quote</h1>
                  <p className="mt-1.5 text-sm text-stone-500">
                    Transparent pricing. This exact breakdown is stored with your policy.
                  </p>

                  <div className="mt-7 rounded-2xl bg-safari-950 p-6 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-sunset-300">
                          {product.name}
                        </p>
                        <p className="mt-1 text-sm text-safari-200/80">
                          {form.fullName || "Visitor"}
                          {totalTravellers > 1 && ` + ${totalTravellers - 1} traveller${totalTravellers > 2 ? "s" : ""}`}
                          {" "}· {days} day{days === 1 ? "" : "s"} ·{" "}
                          {form.arrivalDate && formatDate(form.arrivalDate)} to{" "}
                          {form.departureDate && formatDate(form.departureDate)}
                        </p>
                      </div>
                      <ShieldCheck className="size-6 text-sunset-300" />
                    </div>
                    <p className="mt-6 text-4xl font-bold tracking-tight">
                      {formatUSD(pricing.total)}
                      <span className="ml-2 text-sm font-medium text-safari-200/70">USD total</span>
                    </p>
                  </div>

                  <dl className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-stone-500">
                        Base rate · {pricing.days} days × {formatUSD(pricing.dayRate)}/day
                        {pricing.travellers > 1 && ` × ${pricing.travellers} travellers`}
                      </dt>
                      <dd className="font-medium text-stone-900">
                        {formatUSD(Math.round(pricing.days * pricing.dayRate * pricing.travellers * 100) / 100)}
                      </dd>
                    </div>
                    {pricing.activityLoading > 1 && (
                      <div className="flex justify-between">
                        <dt className="text-stone-500">
                          Activity loading × {pricing.activityLoading.toFixed(1)}
                        </dt>
                        <dd className="font-medium text-stone-900">included</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-stone-200 pt-3">
                      <dt className="font-semibold text-stone-900">Premium</dt>
                      <dd className="font-semibold text-stone-900">{formatUSD(pricing.premium)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">
                        ZTA Levy ({(ZTA_LEVY_RATE * 100).toFixed(0)}% of premium)
                      </dt>
                      <dd className="font-medium text-stone-900">{formatUSD(pricing.ztaLevy)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">
                        Stamp Duty ({(STAMP_DUTY_RATE * 100).toFixed(0)}% of premium)
                      </dt>
                      <dd className="font-medium text-stone-900">{formatUSD(pricing.stampDuty)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-stone-200 pt-3 text-base">
                      <dt className="font-bold text-stone-900">Total Due</dt>
                      <dd className="font-bold text-safari-800">{formatUSD(pricing.total)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* ==================== STEP 5: CHECKOUT SIMULATION ==================== */}
            {step === 4 && (
              <Card>
                <CardContent className="p-7 sm:p-9">
                  <h1 className="text-2xl font-bold tracking-tight text-stone-900">Payment</h1>
                  <p className="mt-1.5 text-sm text-stone-500">
                    This checkout is a simulation and no real charge is made. Live
                    payments will run through Stripe, PayPal and Paynow.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    {(
                      [
                        { id: "card", label: "Card", icon: CreditCard, hint: "Visa · Mastercard · Amex" },
                        { id: "paypal", label: "PayPal", icon: Wallet, hint: "Pay with your account" },
                        { id: "mobile", label: "Mobile money", icon: Smartphone, hint: "EcoCash · Paynow" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => set("paymentMethod", m.id)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-all",
                          form.paymentMethod === m.id
                            ? "border-safari-600 bg-safari-50 ring-1 ring-safari-600"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        )}
                      >
                        <m.icon className="size-5 text-safari-700" />
                        <span className="mt-2 block text-sm font-semibold text-stone-900">{m.label}</span>
                        <span className="mt-0.5 block text-xs text-stone-400">{m.hint}</span>
                      </button>
                    ))}
                  </div>

                  {form.paymentMethod === "card" && (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>Card number</Label>
                        <Input placeholder="4242 4242 4242 4242" inputMode="numeric" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Expiry</Label>
                        <Input placeholder="MM / YY" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>CVC</Label>
                        <Input placeholder="123" inputMode="numeric" />
                      </div>
                    </div>
                  )}

                  <div className="mt-7 flex items-center justify-between rounded-xl bg-stone-50 px-5 py-4">
                    <span className="text-sm text-stone-500">
                      Total due today
                      {totalTravellers > 1 && ` · ${totalTravellers} travellers`}
                    </span>
                    <span className="text-xl font-bold text-stone-900">{formatUSD(pricing.total)}</span>
                  </div>

                  <Button
                    className="mt-6 w-full"
                    size="lg"
                    onClick={simulatePayment}
                    disabled={paying}
                  >
                    {paying ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Processing payment…
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        Pay {formatUSD(pricing.total)} securely
                      </>
                    )}
                  </Button>
                  <p className="mt-3 text-center text-xs text-stone-400">
                    256-bit encrypted · PCI-DSS compliant · Instant certificate on success
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ==================== STEP 6: CERTIFICATE ==================== */}
            {step === 5 && (
              <div>
                <div className="text-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16 }}
                    className="mx-auto grid size-16 place-items-center rounded-full bg-safari-100 text-safari-700"
                  >
                    <BadgeCheck className="size-9" />
                  </motion.span>
                  <h1 className="mt-5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                    {totalTravellers > 1
                      ? `Your group of ${totalTravellers} is covered!`
                      : `You're covered, ${form.fullName.split(" ")[0] || "traveller"}!`}
                  </h1>
                  <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
                    Your certificate has been emailed to {form.email || "your inbox"}.
                    Show the QR code at borders, hotels or hospitals.
                  </p>
                </div>

                {/* Certificate */}
                <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between bg-safari-950 px-6 py-4">
                    <div className="flex items-center gap-2 text-white">
                      <ShieldCheck className="size-5 text-sunset-300" />
                      <span className="text-sm font-bold">Hola Amigo Travelmate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {totalTravellers > 1 && (
                        <Badge variant="dark" className="bg-white/10 text-safari-100">
                          <Users className="size-3" /> Group of {totalTravellers}
                        </Badge>
                      )}
                      <Badge variant="success" className="bg-emerald-400/20 text-emerald-300">
                        ACTIVE ✓
                      </Badge>
                    </div>
                  </div>
                  <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
                    <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone-400">Policy number</dt>
                        <dd className="mt-0.5 font-mono font-bold text-stone-900">{policyNumber}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone-400">
                          {totalTravellers > 1 ? "Group leader" : "Policyholder"}
                        </dt>
                        <dd className="mt-0.5 font-semibold text-stone-900">{form.fullName}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone-400">Plan</dt>
                        <dd className="mt-0.5 font-semibold text-stone-900">{product.name}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone-400">Valid</dt>
                        <dd className="mt-0.5 font-semibold text-stone-900">
                          {form.arrivalDate && formatDate(form.arrivalDate)} to{" "}
                          {form.departureDate && formatDate(form.departureDate)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone-400">Total paid</dt>
                        <dd className="mt-0.5 font-semibold text-stone-900">{formatUSD(pricing.total)} USD</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone-400">Underwritten by</dt>
                        <dd className="mt-0.5 font-semibold text-stone-900">Licensed Zimbabwean insurer</dd>
                      </div>
                    </dl>
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 p-4">
                      <QrCode className="size-20 text-stone-800" />
                      <span className="text-[10px] text-stone-400">Scan to verify</span>
                    </div>
                  </div>
                  {totalTravellers > 1 && (
                    <div className="border-t border-stone-100 px-6 py-5 sm:px-8">
                      <p className="text-xs uppercase tracking-wider text-stone-400">
                        Covered travellers
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        <li className="flex items-center gap-1.5 rounded-full bg-safari-50 px-3 py-1.5 text-xs font-semibold text-safari-900">
                          <Check className="size-3 text-safari-600" /> {form.fullName} (leader)
                        </li>
                        {form.travellers.map((t, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700"
                          >
                            <Check className="size-3 text-safari-600" /> {t.fullName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button size="lg" onClick={() => window.print()}>
                    <Download className="size-4" />
                    Download certificate
                  </Button>
                  <Link href="/portal">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Go to my portal
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        {step < 4 && (
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button onClick={next} disabled={!stepValid} size="lg">
              {step === 3 ? "Continue to payment" : "Continue"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
        {step === 4 && (
          <div className="mt-8">
            <Button variant="ghost" onClick={back} disabled={paying}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
