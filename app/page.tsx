import Link from "next/link";
import {
  ShieldCheck,
  HeartPulse,
  Siren,
  Compass,
  BadgeCheck,
  Landmark,
  LockKeyhole,
  Check,
  ArrowRight,
  MessageCircle,
  QrCode,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { HeroSlider } from "@/components/hero-slider";
import { FEATURED_PRODUCTS } from "@/lib/mock-data";
import { formatUSD } from "@/lib/utils";

const WHY = [
  {
    icon: HeartPulse,
    title: "Medical protection",
    body: "Hospital treatment, doctor visits and medication across Zimbabwe's private healthcare network — without upfront bills.",
  },
  {
    icon: Siren,
    title: "Emergency assistance",
    body: "24/7 assistance line, ambulance dispatch and medical evacuation coordination from Victoria Falls to Great Zimbabwe.",
  },
  {
    icon: Compass,
    title: "Travel confidence",
    body: "One certificate accepted by hotels, tour operators and border officials. Verified in seconds with a QR scan.",
  },
];

const TRUST = [
  {
    icon: Landmark,
    title: "Licensed Insurance Partner",
    body: "Every policy is underwritten by a licensed Zimbabwean microinsurance company, regulated by IPEC.",
  },
  {
    icon: BadgeCheck,
    title: "Tourism Partner Network",
    body: "Trusted by safari operators, lodges and hotels across Victoria Falls, Hwange and Kariba.",
  },
  {
    icon: LockKeyhole,
    title: "Secure Payments",
    body: "International cards, PayPal and African payment methods — processed over encrypted, PCI-compliant rails.",
  },
];

const STEPS = [
  { n: "01", title: "Tell us about your trip", body: "Your details and travel dates — two minutes, from any device." },
  { n: "02", title: "Choose your cover", body: "Essential, Premium or Adventure. One clear price, no fine print." },
  { n: "03", title: "Pay securely", body: "Card, PayPal or mobile money in your currency." },
  { n: "04", title: "Travel covered", body: "Instant digital certificate with a QR code, delivered to your inbox." },
];

export default function LandingPage() {
  return (
    <>
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden bg-safari-950">
        {/* 5-scene background slider under a translucent navy overlay */}
        <HeroSlider />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pt-28 lg:pb-32">
          <FadeIn>
            <Badge variant="dark" className="border border-white/15 bg-white/10 px-4 py-1.5 text-sunset-200">
              <Zap className="size-3.5" />
              Cover issued in under 3 minutes
            </Badge>
          </FadeIn>

          <FadeIn delay={0.08}>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Travel Zimbabwe with{" "}
              <span className="bg-gradient-to-r from-sunset-200 via-sunset-300 to-sunset-400 bg-clip-text text-transparent">
                confidence.
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.16}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-safari-100/80">
              Instant visitor medical and emergency insurance for your Zimbabwean
              adventure — from the mist of Victoria Falls to the plains of Hwange.
              Buy online, verified anywhere.
            </p>
          </FadeIn>

          <FadeIn delay={0.24}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/quote">
                <Button variant="accent" size="lg" className="w-full sm:w-auto">
                  Get Insurance
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/verify">
                <Button variant="outline-light" size="lg" className="w-full sm:w-auto">
                  <QrCode className="size-4" />
                  Verify Policy
                </Button>
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.34}>
            <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {[
                { k: "12,400+", v: "Visitors covered" },
                { k: "63", v: "Nationalities" },
                { k: "24/7", v: "Emergency line" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="text-2xl font-bold text-white sm:text-3xl">{s.k}</dt>
                  <dd className="mt-1 text-xs font-medium uppercase tracking-wider text-safari-200/60">
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
          </FadeIn>
        </div>
      </section>

      {/* ============================ WHY ============================== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-safari-600">
            Why visitor insurance
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Adventure boldly. We handle the what-ifs.
          </h2>
        </FadeIn>
        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          {WHY.map((item) => (
            <StaggerItem key={item.title}>
              <Card className="h-full transition-shadow hover:shadow-lg hover:shadow-safari-900/5">
                <CardContent className="p-7">
                  <span className="grid size-12 place-items-center rounded-2xl bg-safari-50 text-safari-700">
                    <item.icon className="size-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">{item.body}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ============================ PLANS ============================ */}
      <section id="plans" className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <FadeIn>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-safari-600">
                Coverage plans
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                One brand. Clear cover. Fair prices.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-stone-500">
                All plans are backed by our licensed Zimbabwean underwriting partner —
                you choose the cover, we handle the rest.
              </p>
            </div>
          </FadeIn>

          <Stagger className="mt-14 grid gap-6 lg:grid-cols-3">
            {FEATURED_PRODUCTS.map((p) => (
              <StaggerItem key={p.id} className="h-full">
                <Card
                  className={
                    p.popular
                      ? "relative h-full border-safari-700 shadow-xl shadow-safari-900/10 ring-1 ring-safari-700"
                      : "h-full"
                  }
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="dark" className="bg-safari-900 px-4 py-1 text-sunset-300 shadow-md">
                        Most popular
                      </Badge>
                    </span>
                  )}
                  <CardContent className="flex h-full flex-col p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-safari-600">
                      {p.tagline}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-stone-900">{p.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold tracking-tight text-stone-900">
                        {formatUSD(p.basePriceUsd)}
                      </span>
                      <span className="text-sm text-stone-400">from / trip</span>
                    </div>
                    <ul className="mt-6 flex-1 space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-stone-600">
                          <Check className="mt-0.5 size-4 shrink-0 text-safari-600" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/quote?product=${p.id}`} className="mt-7 block">
                      <Button
                        variant={p.popular ? "default" : "outline"}
                        className="w-full"
                        size="lg"
                      >
                        Get covered
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ========================= HOW IT WORKS ======================== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-safari-600">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Covered before your bags are packed
          </h2>
        </FadeIn>
        <Stagger className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <StaggerItem key={s.n}>
              <div className="relative">
                <span className="text-5xl font-bold text-safari-100">{s.n}</span>
                <h3 className="mt-3 font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{s.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ============================ TRUST ============================ */}
      <section className="bg-safari-950 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <FadeIn>
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sunset-300">
                  Built on trust
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Serious insurance behind a simple experience
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-safari-200/70">
                Zimbabwe Visitor Insurance Gateway is operated by a licensed multiple
                agency and underwritten by a licensed microinsurance company — one
                brand for you, full regulatory compliance underneath.
              </p>
            </div>
          </FadeIn>
          <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {TRUST.map((t) => (
              <StaggerItem key={t.title}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur">
                  <span className="grid size-11 place-items-center rounded-xl bg-sunset-400/15 text-sunset-300">
                    <t.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-white">{t.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-safari-200/70">{t.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============================= CTA ============================= */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-safari-800 via-safari-900 to-safari-950 px-8 py-14 text-center sm:px-14 lg:py-20">
            <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-sunset-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-safari-500/20 blur-3xl" />
            <ShieldCheck className="mx-auto size-10 text-sunset-300" />
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your Zimbabwean adventure starts protected
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-safari-100/70">
              Get your certificate in minutes — or message us on WhatsApp and buy
              cover without ever opening a browser.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/quote">
                <Button variant="accent" size="lg" className="w-full sm:w-auto">
                  Get Insurance
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Button variant="outline-light" size="lg" className="w-full sm:w-auto">
                <MessageCircle className="size-4" />
                WhatsApp us (coming soon)
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
