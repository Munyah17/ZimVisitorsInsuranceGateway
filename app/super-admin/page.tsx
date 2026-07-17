"use client";

/**
 * /super-admin — unlinked, unlisted entry point for the platform owner.
 * Prototype gate: a passcode unlocks the console for the session.
 * Live version: dedicated Supabase Auth login + role = 'super_admin'
 * enforced in middleware and RLS, with hardware 2FA.
 */

import { useState } from "react";
import { KeyRound, Loader2, ServerCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SuperAdminConsole } from "./console";

const DEMO_PASSCODE = "SUPER-2026";

export default function SuperAdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    setTimeout(() => {
      if (code.trim().toUpperCase() === DEMO_PASSCODE) {
        setUnlocked(true);
      } else {
        setError(true);
        setBusy(false);
      }
    }, 700);
  };

  if (unlocked) return <SuperAdminConsole />;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-safari-950 px-4">
      <Card className="w-full max-w-sm border-white/10 bg-white/5 backdrop-blur">
        <CardContent className="p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/10 text-sunset-300">
            <ServerCog className="size-7" />
          </span>
          <h1 className="mt-5 text-center text-xl font-bold text-white">
            Super Admin access
          </h1>
          <p className="mt-2 text-center text-sm text-safari-200/60">
            Restricted area for the platform owner. Enter your access passcode
            to continue.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="passcode" className="text-safari-200/80">
                Passcode
              </Label>
              <Input
                id="passcode"
                type="password"
                placeholder="••••••••••"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                className="border-white/15 bg-white/10 text-white placeholder:text-safari-200/30"
              />
            </div>
            {error && (
              <p className="rounded-xl bg-red-500/15 px-4 py-2.5 text-sm text-red-300">
                Incorrect passcode. Access to this console is logged.
              </p>
            )}
            <Button type="submit" variant="accent" size="lg" className="w-full" disabled={busy || !code}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  <KeyRound className="size-4" /> Unlock console
                </>
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-[11px] text-safari-200/40">
            Prototype passcode: SUPER-2026
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
