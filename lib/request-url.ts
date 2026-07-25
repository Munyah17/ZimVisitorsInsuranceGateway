/**
 * Derives the site's public base URL from an incoming Route Handler
 * request, so Paynow's returnurl/resulturl work correctly on production,
 * preview deployments and local dev without a hardcoded env var.
 */
export function getBaseUrl(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("host");
  return `${proto}://${host}`;
}
