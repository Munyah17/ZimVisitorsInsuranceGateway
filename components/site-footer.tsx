import Link from "next/link";
import { LockKeyhole, Landmark, Wallet, Headset } from "lucide-react";
import { Logo } from "@/components/logo";

const STRIP = [
  { icon: LockKeyhole, title: "Secure & Encrypted", body: "Your data is protected" },
  { icon: Landmark, title: "Licensed & Regulated", body: "By the Insurance & Pensions Commission of Zimbabwe" },
  { icon: Wallet, title: "Global Payment Options", body: "Cards, wallets, bank transfer & more" },
  { icon: Headset, title: "24/7 Support", body: "We are here to help" },
];

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Get Insurance", href: "/quote" },
      { label: "Coverage Plans", href: "/#plans" },
      { label: "Verify a Policy", href: "/verify" },
      { label: "Submit a Claim", href: "/claims" },
    ],
  },
  {
    title: "Partners",
    links: [
      { label: "Agent Portal", href: "/agent" },
      { label: "Tourism Operators", href: "/agent" },
      { label: "Hotels & Lodges", href: "/agent" },
      { label: "API Access (soon)", href: "/#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Admin Command Centre", href: "/admin" },
      { label: "Emergency Assistance", href: "/portal" },
      { label: "Contact", href: "/#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-safari-900/10 bg-safari-950 text-safari-100">
      {/* Trust strip (per UI mockup) */}
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {STRIP.map((s) => (
            <div key={s.title} className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-sunset-300">
                <s.icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">{s.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-safari-200/60">{s.body}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="pb-6 text-center font-serif text-lg italic text-sunset-300/90">
          Explore Zimbabwe. We&apos;ve got you covered.
        </p>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-safari-200/70">
              Digital insurance for every visitor to Zimbabwe — issued in minutes,
              verified anywhere, backed by a licensed Zimbabwean underwriter.
            </p>
            <p className="mt-4 text-xs text-safari-200/50">
              Underwritten by Horizon Microinsurance Company · IPEC-MI-2024-007
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-sunset-300">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-safari-200/80 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-safari-200/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 ZVIG Multiple Agency (Pvt) Ltd · Licensed multiple agent, IPEC-MA-2026-041</span>
          <span>Prototype — mock data only. Not an offer of insurance.</span>
        </div>
      </div>
    </footer>
  );
}
