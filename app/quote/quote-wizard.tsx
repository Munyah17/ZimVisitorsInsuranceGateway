"use client";

/**
 * Insurance Quote Flow — 4-step wizard.
 *
 * Step 1  Traveller details    -> writes `customers` on checkout
 *         Individual or group: a group leader fills in every traveller.
 * Step 2  Trip & itinerary     -> writes `travel_details`
 *         Includes accommodation, transport and ZTA document uploads.
 * Step 3  Coverage & quote     -> reads `insurance_products`, creates a `quotes` row
 * Step 4  Payment              -> real Paynow checkout; on confirmed
 *         payment the customer is redirected to /quote/return, which is
 *         where the issued policy, certificate and QR code are shown.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Check,
  CreditCard,
  FileText,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plane,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
  UploadCloud,
  User,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CountrySelect } from "@/components/ui/country-select";
import { Badge } from "@/components/ui/badge";
import {
  ACTIVITIES,
  TRAVEL_PURPOSES,
  type ActivityId,
  type InsuranceProduct,
} from "@/lib/catalog";
import {
  calculatePremium,
  tripDays,
  STAMP_DUTY_RATE,
  ZTA_LEVY_RATE,
} from "@/lib/quote-engine";
import { DESTINATIONS, partnersNear } from "@/lib/partners-data";
import { callingCodeFor } from "@/lib/calling-codes";
import { cn, formatDate, formatUSD } from "@/lib/utils";

const STEPS = [
  "Travellers",
  "Trip & itinerary",
  "Coverage & quote",
  "Payment",
];

/**
 * Documents the Zimbabwe Tourism Authority expects to accompany visitor
 * cover, matched to the purpose of travel. Mock uploads for the prototype;
 * live version stores them in Supabase Storage alongside the quote.
 */
const DOCS_BY_PURPOSE: Record<string, { id: string; label: string; hint: string }[]> = {
  tourism: [
    { id: "accommodation", label: "Accommodation booking", hint: "Hotel or lodge confirmation" },
    { id: "return-ticket", label: "Return / onward ticket", hint: "Proof of departure" },
  ],
  business: [
    { id: "invitation", label: "Invitation letter", hint: "From your host organization" },
    { id: "accommodation", label: "Accommodation booking", hint: "Hotel or lodge confirmation" },
    { id: "return-ticket", label: "Return / onward ticket", hint: "Proof of departure" },
  ],
  study: [
    { id: "admission", label: "Admission letter", hint: "From your institution" },
    { id: "accommodation", label: "Accommodation booking", hint: "Residence or lodging confirmation" },
  ],
  transit: [
    { id: "onward-ticket", label: "Onward ticket", hint: "Your connecting travel" },
  ],
};

const TRANSPORT_MODES = [
  "Air travel",
  "Road · self drive",
  "Road · bus or coach",
  "Rail",
  "Boat or cruise",
];

interface Traveller {
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  passportNumber: string;
  email: string;
  phone: string;
}

const EMPTY_TRAVELLER: Traveller = {
  fullName: "",
  nationality: "",
  dateOfBirth: "",
  passportNumber: "",
  email: "",
  phone: "",
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
  destination: string;
  arrivalDate: string;
  departureDate: string;
  purpose: string;
  activities: ActivityId[];
  accommodation: string;
  modeOfTransport: string;
  transport: string;
  documents: string[];
  // Purpose-specific details
  company: string;
  hostOrganization: string;
  institution: string;
  programme: string;
  finalDestination: string;
  // Coverage & payment
  productId: string;
}

function travellerValid(t: Traveller) {
  return (
    t.fullName.trim().length > 2 &&
    t.nationality &&
    t.dateOfBirth &&
    t.passportNumber.trim().length > 4 &&
    /.+@.+\..+/.test(t.email) &&
    t.phone.trim().length >= 7
  );
}

export function QuoteWizard({ products }: { products: InsuranceProduct[] }) {
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile">("card");
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
    destination: "",
    arrivalDate: "",
    departureDate: "",
    purpose: "tourism",
    activities: ["general"],
    accommodation: "",
    modeOfTransport: "",
    transport: "",
    documents: [],
    company: "",
    hostOrganization: "",
    institution: "",
    programme: "",
    finalDestination: "",
    productId: products[0]?.id ?? "",
  });

  // A ?product= link (e.g. from the landing page plan cards) preselects a
  // plan. Read after mount rather than via useSearchParams(), which forces
  // Next.js to statically prerender this whole wizard as an empty
  // placeholder — the page would otherwise ship with no content until the
  // JS bundle hydrates.
  useEffect(() => {
    const preselected = new URLSearchParams(window.location.search).get("product");
    if (preselected && products.some((p) => p.id === preselected)) {
      setForm((f) => ({ ...f, productId: preselected }));
    }
  }, [products]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setTraveller = (i: number, patch: Partial<Traveller>) =>
    setForm((f) => ({
      ...f,
      travellers: f.travellers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    }));

  /** Phone field is untouched (empty) or still just an auto-filled code — safe to overwrite. */
  const isBarePhoneCode = (phone: string) => phone.trim() === "" || /^\+\d{1,4}$/.test(phone.trim());

  const setLeaderNationality = (v: string) => {
    const code = callingCodeFor(v);
    setForm((f) => ({
      ...f,
      nationality: v,
      phone: code && isBarePhoneCode(f.phone) ? `${code} ` : f.phone,
    }));
  };

  const setTravellerNationality = (i: number, v: string) => {
    const code = callingCodeFor(v);
    setForm((f) => ({
      ...f,
      travellers: f.travellers.map((t, idx) =>
        idx === i
          ? { ...t, nationality: v, phone: code && isBarePhoneCode(t.phone) ? `${code} ` : t.phone }
          : t
      ),
    }));
  };

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

  const product = products.find((p) => p.id === form.productId) ?? products[0];
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

  const leaderErrors = {
    fullName: form.fullName.trim().length > 2 ? "" : "Full name is required",
    nationality: form.nationality ? "" : "Nationality is required",
    passportNumber: form.passportNumber.trim().length > 4 ? "" : "Passport number is required",
    dateOfBirth: form.dateOfBirth ? "" : "Date of birth is required",
    email: /.+@.+\..+/.test(form.email) ? "" : "A valid email is required",
    phone: form.phone.trim().length >= 7 ? "" : "Phone number is required",
  };

  const tripErrors = {
    destination: form.destination ? "" : "Destination is required",
    arrivalDate: form.arrivalDate ? "" : "Arrival date is required",
    departureDate:
      !form.departureDate ? "Departure date is required" : days > 0 ? "" : "Departure must be after arrival",
    modeOfTransport: form.modeOfTransport ? "" : "Mode of transport is required",
    accommodation:
      form.purpose === "transit" || form.accommodation.trim() ? "" : "Accommodation is required",
    company: form.purpose !== "business" || form.company.trim() ? "" : "Company / employer is required",
    hostOrganization:
      form.purpose !== "business" || form.hostOrganization.trim() ? "" : "Host organization is required",
    institution: form.purpose !== "study" || form.institution.trim() ? "" : "Institution is required",
    programme: form.purpose !== "study" || form.programme.trim() ? "" : "Programme / course is required",
    finalDestination:
      form.purpose !== "transit" || form.finalDestination.trim() ? "" : "Final destination is required",
  };

  const stepValid = (() => {
    switch (step) {
      case 0: {
        const leaderOk = Object.values(leaderErrors).every((e) => !e);
        if (!leaderOk) return false;
        if (form.tripType === "group") {
          return form.travellers.length > 0 && form.travellers.every(travellerValid);
        }
        return true;
      }
      case 1: {
        const tripOk = Object.values(tripErrors).every((e) => !e);
        return tripOk && form.activities.length > 0;
      }
      case 2:
        return Boolean(form.productId);
      default:
        return true;
    }
  })();

  const next = () => {
    if (!stepValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => {
    setShowErrors(false);
    setStep((s) => Math.max(s - 1, 0));
  };

  const showLeaderError = (key: keyof typeof leaderErrors) => (showErrors ? leaderErrors[key] : "");
  const showTripError = (key: keyof typeof tripErrors) => (showErrors ? tripErrors[key] : "");
  const errClass = (msg: string) => (msg ? "border-red-400 focus-visible:ring-red-400" : "");

  /**
   * Requests a Paynow hosted checkout session and does a full browser
   * redirect. This app never collects card or mobile money details —
   * Paynow's own page does, and we only learn the outcome afterwards via
   * /quote/return (the customer's browser) and a server-to-server webhook.
   */
  const handlePayment = async () => {
    setPaying(true);
    setPaymentError(null);

    const toTraveller = (t: { fullName: string; nationality: string; dateOfBirth: string; passportNumber: string; email?: string; phone?: string }) => ({
      fullName: t.fullName,
      nationality: t.nationality,
      dateOfBirth: t.dateOfBirth,
      passportNumber: t.passportNumber,
      email: t.email ?? form.email,
      phone: t.phone ?? form.phone,
    });

    try {
      const res = await fetch("/api/checkout/paynow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: `ZVIG-Q-${Date.now()}`,
          productId: form.productId,
          arrivalDate: form.arrivalDate,
          departureDate: form.departureDate,
          purpose: form.purpose,
          destination: form.destination,
          activities: form.activities,
          leader: toTraveller(form),
          travellers: form.tripType === "group" ? form.travellers.map(toTraveller) : [],
          pricingBreakdown: pricing,
          totalAmount: pricing.grandTotal,
        }),
      });

      if (res.status === 503) {
        setPaying(false);
        setPaymentError("Payments aren't available right now. Please try again shortly or contact support.");
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.redirectUrl) {
        setPaying(false);
        setPaymentError(data.message ?? "We couldn't start checkout. Please try again.");
        return;
      }

      window.location.href = data.redirectUrl;
    } catch {
      setPaying(false);
      setPaymentError("We couldn't reach the payment service. Please try again.");
    }
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
        <div className="mb-10 print:hidden">
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
                        className={errClass(showLeaderError("fullName"))}
                        placeholder="e.g. John Smith"
                        value={form.fullName}
                        onChange={(e) => set("fullName", e.target.value)}
                      />
                      {showLeaderError("fullName") && <p className="text-xs text-red-600">{showLeaderError("fullName")}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nationality">Nationality (as shown in passport)</Label>
                      <CountrySelect
                        id="nationality"
                        value={form.nationality}
                        onChange={setLeaderNationality}
                        placeholder="Select nationality"
                        invalid={Boolean(showLeaderError("nationality"))}
                      />
                      {showLeaderError("nationality") && <p className="text-xs text-red-600">{showLeaderError("nationality")}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="passportNumber">Passport number</Label>
                      <Input
                        id="passportNumber"
                        className={errClass(showLeaderError("passportNumber"))}
                        placeholder="e.g. P123456789"
                        value={form.passportNumber}
                        onChange={(e) => set("passportNumber", e.target.value)}
                      />
                      {showLeaderError("passportNumber") && <p className="text-xs text-red-600">{showLeaderError("passportNumber")}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dob">Date of birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        className={errClass(showLeaderError("dateOfBirth"))}
                        value={form.dateOfBirth}
                        onChange={(e) => set("dateOfBirth", e.target.value)}
                      />
                      {showLeaderError("dateOfBirth") && <p className="text-xs text-red-600">{showLeaderError("dateOfBirth")}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="residence">
                        Country of residence{" "}
                        <span className="font-normal text-stone-400">(if different)</span>
                      </Label>
                      <CountrySelect
                        id="residence"
                        value={form.residenceCountry}
                        onChange={(v) => set("residenceCountry", v)}
                        placeholder="Same as nationality"
                        emptyLabel="Same as nationality"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        className={errClass(showLeaderError("email"))}
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                      />
                      {showLeaderError("email") && <p className="text-xs text-red-600">{showLeaderError("email")}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        className={errClass(showLeaderError("phone"))}
                        placeholder={`${callingCodeFor(form.nationality) ?? "+44"} 7700 900123`}
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                      />
                      {showLeaderError("phone") && <p className="text-xs text-red-600">{showLeaderError("phone")}</p>}
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
                                <CountrySelect
                                  value={t.nationality}
                                  onChange={(v) => setTravellerNationality(i, v)}
                                  placeholder="Select nationality"
                                />
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
                              <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input
                                  type="email"
                                  placeholder="Their own certificate is sent here"
                                  value={t.email}
                                  onChange={(e) => setTraveller(i, { email: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Phone</Label>
                                <Input
                                  type="tel"
                                  placeholder={`${callingCodeFor(t.nationality) ?? "+44"} 7700 900123`}
                                  value={t.phone}
                                  onChange={(e) => setTraveller(i, { phone: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-stone-400">
                        Every traveller is individually covered and named on the group
                        certificate, and each receives their own certificate at the
                        email address given above. One payment covers everyone.
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
                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="arrival">Arrival date</Label>
                      <Input
                        id="arrival"
                        type="date"
                        className={errClass(showTripError("arrivalDate"))}
                        value={form.arrivalDate}
                        onChange={(e) => set("arrivalDate", e.target.value)}
                      />
                      {showTripError("arrivalDate") && <p className="text-xs text-red-600">{showTripError("arrivalDate")}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="departure">Departure date</Label>
                      <Input
                        id="departure"
                        type="date"
                        min={form.arrivalDate}
                        className={errClass(showTripError("departureDate"))}
                        value={form.departureDate}
                        onChange={(e) => set("departureDate", e.target.value)}
                      />
                      {showTripError("departureDate") && <p className="text-xs text-red-600">{showTripError("departureDate")}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="destination">Destination</Label>
                      <Select
                        id="destination"
                        className={errClass(showTripError("destination"))}
                        value={form.destination}
                        onChange={(e) => set("destination", e.target.value)}
                      >
                        <option value="">Select destination</option>
                        {DESTINATIONS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </Select>
                      {showTripError("destination") && <p className="text-xs text-red-600">{showTripError("destination")}</p>}
                    </div>
                    <div className="space-y-1.5">
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

                    {/* Purpose-matched details */}
                    {form.purpose === "business" && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="company">Company / employer</Label>
                          <Input
                            id="company"
                            className={errClass(showTripError("company"))}
                            placeholder="e.g. Acme Logistics Ltd"
                            value={form.company}
                            onChange={(e) => set("company", e.target.value)}
                          />
                          {showTripError("company") && <p className="text-xs text-red-600">{showTripError("company")}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="hostOrganization">Host organization in Zimbabwe</Label>
                          <Input
                            id="hostOrganization"
                            className={errClass(showTripError("hostOrganization"))}
                            placeholder="Who you are visiting"
                            value={form.hostOrganization}
                            onChange={(e) => set("hostOrganization", e.target.value)}
                          />
                          {showTripError("hostOrganization") && <p className="text-xs text-red-600">{showTripError("hostOrganization")}</p>}
                        </div>
                      </>
                    )}
                    {form.purpose === "study" && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="institution">Institution in Zimbabwe</Label>
                          <Input
                            id="institution"
                            className={errClass(showTripError("institution"))}
                            placeholder="e.g. University of Zimbabwe"
                            value={form.institution}
                            onChange={(e) => set("institution", e.target.value)}
                          />
                          {showTripError("institution") && <p className="text-xs text-red-600">{showTripError("institution")}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="programme">Programme / course</Label>
                          <Input
                            id="programme"
                            className={errClass(showTripError("programme"))}
                            placeholder="e.g. Semester exchange, BSc Biology"
                            value={form.programme}
                            onChange={(e) => set("programme", e.target.value)}
                          />
                          {showTripError("programme") && <p className="text-xs text-red-600">{showTripError("programme")}</p>}
                        </div>
                      </>
                    )}
                    {form.purpose === "transit" && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="finalDestination">Final destination</Label>
                        <Input
                          id="finalDestination"
                          className={errClass(showTripError("finalDestination"))}
                          placeholder="Where you are headed after Zimbabwe"
                          value={form.finalDestination}
                          onChange={(e) => set("finalDestination", e.target.value)}
                        />
                        {showTripError("finalDestination") && <p className="text-xs text-red-600">{showTripError("finalDestination")}</p>}
                      </div>
                    )}
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

                  {/* Service providers near the chosen destination */}
                  {form.destination && form.destination !== "Multiple" && (
                    <div className="mt-6 rounded-xl border border-safari-100 bg-safari-50/60 p-4">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-safari-700">
                        <MapPin className="size-3.5" />
                        Service providers near {form.destination}
                      </p>
                      <ul className="mt-3 space-y-2">
                        {partnersNear(form.destination, 3).map((p) => (
                          <li
                            key={p.name}
                            className="flex items-center justify-between gap-3 rounded-lg bg-white px-3.5 py-2.5 text-sm"
                          >
                            <span className="min-w-0 truncate font-medium text-stone-800">{p.name}</span>
                            <span className="shrink-0 text-xs text-stone-400">{p.category}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/partners?city=${encodeURIComponent(form.destination)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-xs font-semibold text-safari-700 underline underline-offset-2 hover:text-safari-900"
                      >
                        View all partners in {form.destination} ↗
                      </Link>
                    </div>
                  )}

                  <div className="mt-7">
                    <Label>Planned activities</Label>
                    {showErrors && form.activities.length === 0 && (
                      <p className="mt-1 text-xs text-red-600">Select at least one activity</p>
                    )}
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
                      <Label htmlFor="accommodation">
                        Accommodation
                        {form.purpose === "transit" && (
                          <span className="font-normal text-stone-400"> (if staying overnight)</span>
                        )}
                      </Label>
                      <div className="relative">
                        <BedDouble className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                        <Input
                          id="accommodation"
                          className={cn("pl-10", errClass(showTripError("accommodation")))}
                          placeholder="e.g. Victoria Falls Hotel"
                          value={form.accommodation}
                          onChange={(e) => set("accommodation", e.target.value)}
                        />
                      </div>
                      {showTripError("accommodation") && <p className="text-xs text-red-600">{showTripError("accommodation")}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="modeOfTransport">Mode of transport</Label>
                      <Select
                        id="modeOfTransport"
                        className={errClass(showTripError("modeOfTransport"))}
                        value={form.modeOfTransport}
                        onChange={(e) => set("modeOfTransport", e.target.value)}
                      >
                        <option value="">Select mode of transport</option>
                        {TRANSPORT_MODES.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </Select>
                      {showTripError("modeOfTransport") && <p className="text-xs text-red-600">{showTripError("modeOfTransport")}</p>}
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="transport">
                        Transport details{" "}
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
                      {(DOCS_BY_PURPOSE[form.purpose] ?? DOCS_BY_PURPOSE.tourism).map((d) => {
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

            {/* ==================== STEP 3: COVERAGE & QUOTE ==================== */}
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
                  {products.map((p) => {
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

                <Card className="mt-8">
                  <CardContent className="p-7 sm:p-9">
                    <h2 className="text-xl font-bold tracking-tight text-stone-900">Your quote</h2>

                    <div className="rounded-2xl bg-safari-950 p-6 text-white">
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
                        {formatUSD(pricing.grandTotal)}
                        <span className="ml-2 text-sm font-medium text-safari-200/70">USD total</span>
                      </p>
                    </div>

                    <dl className="mt-6 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="font-semibold text-stone-900">
                          Premium
                          {pricing.travellers > 1 && (
                            <span className="font-normal text-stone-400"> · {pricing.travellers} travellers</span>
                          )}
                        </dt>
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
                        <dt className="font-bold text-stone-900">Total</dt>
                        <dd className="font-bold text-safari-800">{formatUSD(pricing.grandTotal)}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== STEP 4: CHECKOUT ==================== */}
            {step === 3 && (
              <Card>
                <CardContent className="p-7 sm:p-9">
                  <h1 className="text-2xl font-bold tracking-tight text-stone-900">Payment</h1>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={cn(
                      "mt-7 flex w-full items-center gap-4 rounded-xl border p-5 text-left transition-colors",
                      paymentMethod === "card"
                        ? "border-safari-500 bg-safari-50 ring-1 ring-safari-500"
                        : "border-stone-200 bg-white hover:border-safari-300"
                    )}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-safari-950 text-sunset-300">
                      <CreditCard className="size-5" />
                    </span>
                    <span>
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-stone-900">International Card</span>
                        <Badge variant="success">Recommended</Badge>
                      </span>
                      <span className="mt-0.5 block text-xs text-stone-400">Visa, Mastercard and other major cards</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mobile")}
                    className={cn(
                      "mt-3 flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors",
                      paymentMethod === "mobile"
                        ? "border-safari-500 bg-safari-50 ring-1 ring-safari-500"
                        : "border-stone-200 bg-white hover:border-safari-300"
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-600">
                      <Smartphone className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-stone-900">Local mobile money</span>
                      <span className="mt-0.5 block text-xs text-stone-400">EcoCash · OneMoney</span>
                    </span>
                  </button>

                  <div className="mt-7 flex items-center justify-between rounded-xl bg-stone-50 px-5 py-4">
                    <span className="text-sm text-stone-500">
                      Total due today
                      {totalTravellers > 1 && ` · ${totalTravellers} travellers`}
                    </span>
                    <span className="text-xl font-bold text-stone-900">{formatUSD(pricing.total)}</span>
                  </div>

                  {paymentError && (
                    <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      {paymentError}
                    </p>
                  )}

                  <Button
                    className="mt-6 w-full"
                    size="lg"
                    onClick={handlePayment}
                    disabled={paying}
                  >
                    {paying ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Redirecting to Paynow…
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        Pay {formatUSD(pricing.total)} with Paynow
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        {step < 3 && (
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button onClick={next} size="lg">
              {step === 2 ? "Continue to payment" : "Continue"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
        {step < 3 && showErrors && !stepValid && (
          <p className="mt-3 text-right text-xs text-red-600">
            Please fill in the highlighted fields to continue.
          </p>
        )}
        {step === 3 && (
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
