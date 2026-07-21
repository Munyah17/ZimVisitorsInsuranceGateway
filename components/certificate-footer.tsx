/**
 * Required credit line on every issued policy / certificate document,
 * distinct from the site-wide footer (which is print:hidden chrome).
 * This renders INSIDE certificate cards so it survives printing/PDF export.
 */
export function CertificateFooter() {
  return (
    <div className="border-t border-stone-100 bg-stone-50/60 px-6 py-3 text-center text-[11px] text-stone-400 sm:px-8">
      Developed &amp; Powered By{" "}
      <a
        href="https://globalspaceweb.co.zw"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-stone-500 underline underline-offset-2 hover:text-safari-700"
      >
        Global Space Web
      </a>
      {" | "}
      <a href="mailto:info@globalspaceweb.co.zw" className="hover:text-safari-700">
        info@globalspaceweb.co.zw
      </a>
      {" | "}
      <a href="tel:+263773909307" className="hover:text-safari-700">
        +263773909307
      </a>
    </div>
  );
}
