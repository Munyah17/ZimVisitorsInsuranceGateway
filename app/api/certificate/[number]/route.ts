/**
 * GET /api/certificate/{number} — generates the real policy certificate as
 * a standalone PDF (not a screenshot of the dashboard page). One clean
 * A4 document: policy details, coverage summary and a real, scannable QR
 * code linking to /verify?number=... — built server side with pdf-lib and
 * streamed back as application/pdf for the browser to download or print.
 */

import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { fetchLivePolicy } from "@/lib/policy-lookup";
import { getBaseUrl } from "@/lib/request-url";
import { formatDate } from "@/lib/utils";

const SAFARI_950 = rgb(0.078, 0.114, 0.09); // matches Tailwind safari-950
const SUNSET_300 = rgb(0.98, 0.71, 0.35);
const STONE_400 = rgb(0.66, 0.63, 0.6);
const STONE_900 = rgb(0.11, 0.1, 0.09);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;

  let policy;
  try {
    policy = await fetchLivePolicy(decodeURIComponent(number));
  } catch (err) {
    console.error("Certificate lookup failed", err);
    return NextResponse.json({ error: "Certificate generation is temporarily unavailable." }, { status: 503 });
  }

  if (!policy) {
    return NextResponse.json({ error: "No policy matches that number." }, { status: 404 });
  }

  const verifyUrl = `${getBaseUrl(request)}/verify?number=${encodeURIComponent(policy.policyNumber)}`;
  const qrPng = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 240 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait, points
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const qrImage = await pdf.embedPng(qrPng);

  let y = height - 60;

  // Header band
  page.drawRectangle({ x: 0, y: y - 20, width, height: 90, color: SAFARI_950 });
  page.drawText("Zim Travelmate", { x: 48, y: y + 18, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Zimbabwe Visitor Insurance Certificate", {
    x: 48,
    y: y - 2,
    size: 11,
    font,
    color: SUNSET_300,
  });
  page.drawText(
    policy.status === "active" ? "ACTIVE" : policy.status.replace(/_/g, " ").toUpperCase(),
    { x: width - 150, y: y + 12, size: 12, font: bold, color: SUNSET_300 }
  );
  y -= 100;

  const field = (label: string, value: string) => {
    page.drawText(label.toUpperCase(), { x: 48, y, size: 8, font, color: STONE_400 });
    page.drawText(value, { x: 48, y: y - 15, size: 12, font: bold, color: STONE_900 });
    y -= 42;
  };

  field("Policy Number", policy.policyNumber);
  field("Policyholder", policy.holderName);
  field("Nationality", policy.nationality);
  field("Coverage Plan", policy.productName);
  field("Coverage Summary", policy.coverageSummary);
  field("Valid", `${formatDate(policy.startDate)} to ${formatDate(policy.endDate)}`);
  field("Premium Paid", `${policy.currency} ${policy.premium.toFixed(2)}`);

  // QR block
  const qrSize = 120;
  page.drawImage(qrImage, { x: width - qrSize - 48, y: 140, width: qrSize, height: qrSize });
  page.drawText("Scan to verify", {
    x: width - qrSize - 48,
    y: 124,
    size: 9,
    font,
    color: STONE_400,
  });

  page.drawText("Emergency Assistance: +263 78 000 1111", {
    x: 48,
    y: 120,
    size: 10,
    font: bold,
    color: STONE_900,
  });
  page.drawText(
    "This certificate confirms cover under the policy referenced above, underwritten by a",
    { x: 48, y: 100, size: 8, font, color: STONE_400 }
  );
  page.drawText("licensed Zimbabwean microinsurer and regulated by IPEC.", {
    x: 48,
    y: 89,
    size: 8,
    font,
    color: STONE_400,
  });

  page.drawLine({ start: { x: 48, y: 60 }, end: { x: width - 48, y: 60 }, thickness: 0.5, color: STONE_400 });
  page.drawText("Developed & Powered By Global Space Web | info@globalspaceweb.co.zw | +263773909307", {
    x: 48,
    y: 42,
    size: 7,
    font,
    color: STONE_400,
  });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${policy.policyNumber}.pdf"`,
    },
  });
}
