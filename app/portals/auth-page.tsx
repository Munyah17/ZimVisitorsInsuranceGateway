"use client";

/**
 * Login / Signup — mock authentication for the prototype.
 *
 * Demo credentials sign users into the Client, Agent or Admin portal.
 * Live version: Supabase Auth (email OTP + Google), with the role claim in
 * the JWT routing each session to its portal automatically.
 *
 * Admin and Super Admin are separate, independent roles. The Super Admin
 * console is not listed here; platform owners sign in at /super-admin.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DEMO_ACCOUNTS = [
  {
    role: "Client Portal",
    icon: UserRound,
    email: "john.smith@example.com",
    password: "client123",
    dest: "/portal",
    hint: "Policyholders and visitors",
  },
  {
    role: "Agent Portal",
    icon: Briefcase,
    email: "tendai@shearwater.co.zw",
    password: "agent123",
    dest: "/agent",
    hint: "Travel agents, operators and hotels",
  },
  {
    role: "Admin Portal",
    icon: ShieldCheck,
    email: "admin@zvig.co.zw",
    password: "admin123",
    dest: "/admin",
    hint: "Travelmate Zim operations team",
  },
];

export function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fill = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setTab("login");
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    setTimeout(() => {
      if (tab === "signup") {
        router.push("/portal");
        return;
      }
      const acc = DEMO_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
      );
      if (acc) {
        router.push(acc.dest);
      } else {
        setBusy(false);
        setError("No account matches those details. Try one of the demo accounts below.");
      }
    }, 900);
  };

  return (
    <div className="bg-gradient-to-b from-safari-50/60 to-transparent">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-safari-950 text-sunset-300 shadow-lg">
            <LogIn className="size-7" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-stone-500">
            Sign in to manage your policy, your sales or the platform. Your role
            takes you straight to the right portal.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Auth card */}
          <Card className="h-fit">
            <CardContent className="p-6 sm:p-8">
              {/* Tabs */}
              <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1">
                {(["login", "signup"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTab(t);
                      setError("");
                    }}
                    className={cn(
                      "rounded-lg py-2 text-sm font-semibold transition-all",
                      tab === t ? "bg-white text-safari-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    {t === "login" ? "Login" : "Sign up"}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4">
                {tab === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. John Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {tab === "login" ? "Signing in…" : "Creating account…"}
                    </>
                  ) : tab === "login" ? (
                    "Login"
                  ) : (
                    "Create account"
                  )}
                </Button>
                {tab === "signup" && (
                  <p className="text-center text-xs text-stone-400">
                    New accounts start as Client accounts. Agents are approved by
                    the Travelmate Zim team after applying.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Demo credentials */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              Demo accounts
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Tap an account to fill the login form, then press Login.
            </p>
            <div className="mt-4 space-y-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fill(acc)}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 text-left shadow-sm transition-all hover:border-safari-300 hover:shadow-md"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-safari-950 text-sunset-300">
                    <acc.icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-stone-900">{acc.role}</span>
                    <span className="block text-xs text-stone-400">{acc.hint}</span>
                    <span className="mt-1.5 block truncate font-mono text-xs text-stone-500">
                      {acc.email} · {acc.password}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-safari-700 opacity-0 transition-opacity group-hover:opacity-100">
                    Use →
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-stone-400">
              Admin and Super Admin are independent roles. The Admin portal runs
              day to day operations; platform configuration lives in a separate
              console reserved for the platform owner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
