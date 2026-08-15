/**
 * GET /api/qr?text=... — renders a real, scannable QR code as a PNG.
 * Backs <QrCodeImage> (components/qr-code.tsx) everywhere a policy QR is
 * shown on screen. The certificate PDF route embeds its own QR directly
 * (app/api/certificate/[number]/route.ts) rather than fetching this.
 */

import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: Request) {
  const text = new URL(request.url).searchParams.get("text");
  if (!text) {
    return NextResponse.json({ error: "Missing ?text=" }, { status: 400 });
  }

  const png = await QRCode.toBuffer(text, { margin: 1, width: 320 });
  return new NextResponse(Buffer.from(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
