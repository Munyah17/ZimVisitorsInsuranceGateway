"use client";

/**
 * Public Policy Verification — live against Supabase via
 * GET /api/policy/{number} (app/api/policy/[number]/route.ts).
 *
 * Reads ?number= from window.location.search after mount (not
 * useSearchParams(), which forces this to prerender as an empty
 * placeholder) so scanning a certificate QR code opens this page with
 * the result pre-filled and auto-verified.
 */

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CircleX,
  Loader2,
  QrCode,
  Search,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface LivePolicy {
  policyNumber: string;
  status: string;
  holderName: string;
  nationality: string;
  startDate: string;
  endDate: string;
  coverageSummary: string;
}

type Result =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "valid"; policy: LivePolicy }
  | { state: "expired"; policy: LivePolicy }
  | { state: "invalid" }
  | { state: "unavailable" };

export default function VerifyPage() {
  const [number, setNumber] = useState("");
  const [result, setResult] = useState<Result>({ state: "idle" });

  const verify = async (value: string) => {
    if (!value.trim()) return;
    setResult({ state: "loading" });
    try {
      const res = await fetch(`/api/policy/${encodeURIComponent(value.trim())}`);
      if (res.status === 503) {
        setResult({ state: "unavailable" });
        return;
      }
      const body = await res.json();
      if (!body.found) {
        setResult({ state: "invalid" });
        return;
      }
      const policy = body.policy as LivePolicy;
      setResult({ state: policy.status === "active" ? "valid" : "expired", policy });
    } catch {
      setResult({ state: "unavailable" });
    }
  };

  useEffect(() => {
    const fromQr = new URLSearchParams(window.location.search).get("number");
    if (fromQr) {
      setNumber(fromQr);
      verify(fromQr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-gradient-to-b from-safari-50/60 to-transparent">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-safari-950 text-sunset-300 shadow-lg">
            <ShieldCheck className="size-7" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Verify a policy
          </h1>
          <p className="mx-auto mt-3 max-w-md text-stone-500">
            For border officials, hotels, hospitals and tour operators. Enter a
            policy number to confirm cover instantly.
          </p>
        </div>

        <Card className="mt-9">
          <CardContent className="p-6 sm:p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verify(number);
              }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Input
                placeholder="e.g. ZVIG-2026-00001"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="font-mono uppercase"
                aria-label="Policy number"
              />
              <Button type="submit" size="lg" className="sm:w-36" disabled={result.state === "loading"}>
                {result.state === "loading" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Search className="size-4" /> Verify
                  </>
                )}
              </Button>
            </form>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-400">
              <QrCode className="size-3.5" />
              Scanning a certificate QR code opens this page with the result pre-filled.
            </p>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {(result.state === "valid" || result.state === "expired") && (
            <motion.div
              key={result.state + result.policy.policyNumber}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card
                className={
                  result.state === "valid"
                    ? "mt-6 border-emerald-300 bg-emerald-50/60"
                    : "mt-6 border-amber-300 bg-amber-50/60"
                }
              >
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BadgeCheck
                        className={
                          result.state === "valid"
                            ? "size-8 text-emerald-600"
                            : "size-8 text-amber-600"
                        }
                      />
                      <div>
                        <p
                          className={
                            result.state === "valid"
                              ? "text-xl font-bold text-emerald-800"
                              : "text-xl font-bold text-amber-800"
                          }
                        >
                          {result.state === "valid" ? "VALID POLICY ✓" : "POLICY EXPIRED"}
                        </p>
                        <p className="font-mono text-sm text-stone-500">
                          {result.policy.policyNumber}
                        </p>
                      </div>
                    </div>
                    <Badge variant={result.state === "valid" ? "success" : "warning"}>
                      {result.state === "valid" ? "Active" : "Expired"}
                    </Badge>
                  </div>

                  <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-stone-200/70 pt-6 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-stone-400">Policyholder</dt>
                      <dd className="mt-0.5 font-semibold text-stone-900">{result.policy.holderName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-stone-400">Nationality</dt>
                      <dd className="mt-0.5 font-semibold text-stone-900">{result.policy.nationality}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-stone-400">Valid until</dt>
                      <dd className="mt-0.5 font-semibold text-stone-900">
                        {formatDate(result.policy.endDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-stone-400">Coverage</dt>
                      <dd className="mt-0.5 font-semibold text-stone-900">
                        {result.policy.coverageSummary}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-5 text-xs text-stone-400">
                    Verified against the Zim Travelmate policy registry.
                    This check discloses only the fields shown and reveals no
                    contact or passport data.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {result.state === "invalid" && (
            <motion.div
              key="invalid"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="mt-6 border-red-300 bg-red-50/60">
                <CardContent className="flex items-center gap-3 p-6 sm:p-8">
                  <CircleX className="size-8 shrink-0 text-red-600" />
                  <div>
                    <p className="text-xl font-bold text-red-800">NO POLICY FOUND</p>
                    <p className="mt-1 text-sm text-stone-500">
                      No policy matches that number. Check the number and try again, or
                      contact support on +263 78 000 1111.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {result.state === "unavailable" && (
            <motion.div
              key="unavailable"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="mt-6 border-stone-300 bg-stone-50">
                <CardContent className="flex items-center gap-3 p-6 sm:p-8">
                  <CircleX className="size-8 shrink-0 text-stone-500" />
                  <div>
                    <p className="text-xl font-bold text-stone-800">Verification unavailable</p>
                    <p className="mt-1 text-sm text-stone-500">
                      We couldn&apos;t reach the policy registry. Please try again shortly.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
