import Link from "next/link";
import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Get Started Now!", href: "/quote" },
      { label: "Coverage Plans", href: "/coverage" },
      { label: "Verify a Policy", href: "/verify" },
      { label: "Submit a Claim", href: "/claims" },
    ],
  },
  {
    title: "Partners",
    links: [
      { label: "Service Partners", href: "/partners" },
      { label: "Agent Portal", href: "/portals" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Login / Signup", href: "/portals" },
      { label: "Emergency Assistance", href: "/portal" },
      { label: "Contact", href: "/#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-safari-900/10 bg-safari-950 text-safari-100 print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
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
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs">
          <a
            href="https://globalspaceweb.co.zw"
            target="_blank"
            rel="noopener noreferrer"
            title="+263 77 390 9307"
            className="group inline-block text-safari-200/50 transition-colors hover:text-sunset-300"
          >
            © 2026 Zim Travel Mate. All Rights Reserved · Powered By{" "}
            <span className="font-semibold underline decoration-sunset-400/40 underline-offset-2 group-hover:decoration-sunset-300">
              Global Space Web
            </span>
            <span className="ml-1.5 hidden font-medium text-sunset-300 group-hover:inline">
              · +263 77 390 9307
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
