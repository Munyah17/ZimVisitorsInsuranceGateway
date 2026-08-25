"use client";

/**
 * Login / Signup — real Supabase Auth.
 *
 * Login calls supabase.auth.signInWithPassword directly (safe with the anon
 * key) then reads the caller's role from `users` (RLS: "users read own
 * record" restricts this to their own row) to route to the right portal.
 * Signup goes through /api/auth/signup because inserting the `users` row
 * needs the service-role key — there's no client-side insert policy.
 *
 * Admin and Super Admin are separate, independent roles. The Super Admin
 * console is not listed here; platform owners sign in at /private.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InsurerSelect } from "@/components/ui/insurer-select";
import { getSupabase } from "@/lib/supabase";
import { DEFAULT_INSURER_ID } from "@/lib/insurers";

const ROLE_DEST: Record<string, string> = {
  customer: "/portal",
  agent: "/agent",
  admin: "/admin",
  underwriter_staff: "/admin",
  support: "/admin",
};

export function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [insurerId, setInsurerId] = useState(DEFAULT_INSURER_ID);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (tab === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, insurerId: insurerId || null }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(body.error || "Could not create your account. Please try again.");
          setBusy(false);
          return;
        }
      }

      const supabase = getSupabase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError || !data.user) {
        setError(signInError?.message || "No account matches those details.");
        setBusy(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("auth_user_id", data.user.id)
        .single();

      router.push(ROLE_DEST[profile?.role ?? "customer"] ?? "/portal");
    } catch {
      setError("Sign-in is not available right now. Please contact support.");
      setBusy(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-safari-50/60 to-transparent">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
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

        <div className="mt-10">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1">
                {(["login", "signup"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTab(t);
                      setError("");
                    }}
                    className={
                      "rounded-lg py-2 text-sm font-semibold transition-all " +
                      (tab === t
                        ? "bg-white text-safari-900 shadow-sm"
                        : "text-stone-500 hover:text-stone-700")
                    }
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
                      minLength={8}
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

                {tab === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="insurer">Select Insurer</Label>
                    <InsurerSelect id="insurer" value={insurerId} onChange={setInsurerId} />
                  </div>
                )}

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
                    the Zim Travelmate team after applying.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
