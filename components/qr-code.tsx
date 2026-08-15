/**
 * Real, scannable QR code (backed by /api/qr) — not a decorative icon.
 * Encodes a full verify URL so scanning it opens /verify pre-filled.
 */

export function policyVerifyUrl(policyNumber: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/verify?number=${encodeURIComponent(policyNumber)}`;
  }
  return `/verify?number=${encodeURIComponent(policyNumber)}`;
}

export function QrCodeImage({
  value,
  size = 96,
  className = "",
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={`/api/qr?text=${encodeURIComponent(value)}`}
      width={size}
      height={size}
      alt="Scan to verify this policy"
      className={className}
    />
  );
}
