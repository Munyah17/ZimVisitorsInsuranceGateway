"use client";

/**
 * /super-admin — unlinked, unlisted entry point for the platform owner.
 *
 * Owner account (prototype):
 *   Munyah Griezmann · username "Munyah" · munyamuzvidziwa19@gmail.com
 * The gate asks for username + PIN. Live version: dedicated Supabase Auth
 * login + role = 'super_admin' enforced in middleware and RLS, with 2FA.
 */

import { useState } from "react";
import { KeyRound, Loader2, ServerCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SuperAdminConsole } from "./console";

const SUPER_ADMIN = {
  name: "Munyah Griezmann",
  username: "Munyah",
  email: "munyamuzvidziwa19@gmail.com",
  pin: "3743",
};

export default function SuperAdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    setTimeout(() => {
      const nameOk =
        username.trim().toLowerCase() === SUPER_ADMIN.username.toLowerCase() ||
        username.trim().toLowerCase() === SUPER_ADMIN.email.toLowerCase();
      if (nameOk && pin.trim() === SUPER_ADMIN.pin) {
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
            Restricted area for the platform owner. Sign in with your username
            and PIN.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-safari-200/80">
                Username or email
              </Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                className="border-white/15 bg-white/10 text-white placeholder:text-safari-200/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pin" className="text-safari-200/80">
                PIN
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="border-white/15 bg-white/10 text-white placeholder:text-safari-200/30"
              />
            </div>
            {error && (
              <p className="rounded-xl bg-red-500/15 px-4 py-2.5 text-sm text-red-300">
                Incorrect username or PIN. Access to this console is logged.
              </p>
            )}
            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full"
              disabled={busy || !username || !pin}
            >
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
        </CardContent>
      </Card>
    </div>
  );
}
