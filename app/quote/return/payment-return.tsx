"use client";

/**
 * Where Paynow's hosted checkout sends the customer's BROWSER back to
 * (Paynow's `returnurl`) — separate from the server-to-server webhook.
 * Polls our own status endpoint, which itself falls back to asking Paynow
 * directly via pollUrl if the webhook hasn't landed yet.
 *
 * Reads ?reference= from window.location.search after mount rather than
 * useSearchParams(), which would force Next.js to statically prerender
 * this page as an empty placeholder with no content until JS hydrates.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleX,
  Download,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CertificateFooter } from "@/components/certificate-footer";
import { ZimRibbon } from "@/components/zim-ribbon";
import { QrCodeImage, policyVerifyUrl } from "@/components/qr-code";
import { formatDate } from "@/lib/utils";

interface IssuedPolicy {
  policyNumber: string;
  holderName: string;
  startDate: string;
  endDate: string;
}

type Outcome =
  | { state: "checking" }
  | { state: "pending" }
  | { state: "succeeded"; policies: IssuedPolicy[] }
  | { state: "failed" }
  | { state: "not_found" };

const POLL_MS = 2500;
const MAX_ATTEMPTS = 24; // ~60 seconds

export function PaymentReturn() {
  const [reference, setReference] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>({ state: "checking" });
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    setReference(new URLSearchParams(window.location.search).get("reference"));
  }, []);

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/checkout/paynow/status?reference=${encodeURIComponent(reference)}`);
        const data = await res.json();
        if (cancelled) return;

        if (data.status === "succeeded") {
          setOutcome({ state: "succeeded", policies: data.policies ?? [] });
        } else if (data.status === "failed") {
          setOutcome({ state: "failed" });
        } else if (data.status === "not_found") {
          setOutcome({ state: "not_found" });
        } else {
          setOutcome({ state: "pending" });
          setAttempts((a) => a + 1);
        }
      } catch {
        if (!cancelled) setAttempts((a) => a + 1);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, attempts]);

  useEffect(() => {
    if (outcome.state !== "pending" && outcome.state !== "checking") return;
    if (attempts >= MAX_ATTEMPTS) return;
    const t = setTimeout(() => setAttempts((a) => a + 1), POLL_MS);
    return () => clearTimeout(t);
  }, [outcome.state, attempts]);

  return (
    <div className="bg-gradient-to-b from-safari-50/60 to-transparent">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        {(outcome.state === "checking" || outcome.state === "pending") && (
          <div className="text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-safari-100 text-safari-700">
              <Loader2 className="size-8 animate-spin" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Confirming your payment…
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
              {attempts >= MAX_ATTEMPTS
                ? "This is taking longer than usual. If Paynow confirmed your payment, your certificate will arrive by email shortly — you can also check your policy from your portal in a few minutes."
                : "Paynow is finalising your transaction. This usually takes a few seconds."}
            </p>
          </div>
        )}

        {outcome.state === "succeeded" && outcome.policies.length > 0 && (
          <div>
            <div className="text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-safari-100 text-safari-700">
                <BadgeCheck className="size-9" />
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                {outcome.policies.length > 1
                  ? `Your group of ${outcome.policies.length} is covered!`
                  : "You're covered!"}
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
                Payment confirmed by Paynow. Each traveller has been emailed their
                own certificate.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
              <ZimRibbon />
              <div className="flex items-center justify-between bg-safari-950 px-6 py-4">
                <div className="flex items-center gap-2 text-white">
                  <ShieldCheck className="size-5 text-sunset-300" />
                  <span className="text-sm font-bold">Zim Travelmate</span>
                </div>
                <Badge variant="success" className="bg-emerald-400/20 text-emerald-300">
                  ACTIVE ✓
                </Badge>
              </div>
              <div className="space-y-3 p-6 sm:p-8">
                {outcome.policies.map((p) => (
                  <div
                    key={p.policyNumber}
                    className="flex items-center justify-between gap-4 rounded-xl bg-stone-50 px-4 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-900">{p.holderName}</p>
                      <p className="mt-0.5 font-mono text-xs text-stone-400">{p.policyNumber}</p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {formatDate(p.startDate)} to {formatDate(p.endDate)}
                      </p>
                    </div>
                    <a href={`/api/certificate/${encodeURIComponent(p.policyNumber)}`} className="shrink-0">
                      <Button size="sm" variant="outline">
                        <Download className="size-4" /> PDF
                      </Button>
                    </a>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-2 pt-2 text-center">
                  <span className="rounded-xl border border-stone-200 bg-white p-2">
                    <QrCodeImage value={policyVerifyUrl(outcome.policies[0].policyNumber)} size={96} />
                  </span>
                  <p className="text-xs text-stone-400">
                    Scan your certificate QR at borders, hotels or hospitals
                  </p>
                </div>
              </div>
              <CertificateFooter />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a href={`/api/certificate/${encodeURIComponent(outcome.policies[0].policyNumber)}`}>
                <Button size="lg">
                  <Download className="size-4" />
                  Download certificate
                </Button>
              </a>
              <Link href="/portal">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Go to my portal
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {(outcome.state === "failed" || outcome.state === "not_found") && (
          <div className="text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-600">
              <CircleX className="size-9" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Payment not completed
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
              {outcome.state === "failed"
                ? "Paynow reported this payment as cancelled or unsuccessful. No policy has been issued and you have not been charged."
                : "We couldn't find a matching payment. If you completed checkout, contact support with your reference number."}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/quote">
                <Button size="lg">
                  Try again
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a href="https://wa.me/263780250962" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  WhatsApp support
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
