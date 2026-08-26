import { NextResponse } from "next/server";
import {
  verifyPaynowCallback,
  PAYNOW_PAID_STATUSES,
  PAYNOW_FAILED_STATUSES,
} from "@/lib/payment-gateways/paynow";
import { activatePaidPayment, markPaymentFailed } from "@/lib/payment-gateways/fulfillment";
import { getBaseUrl } from "@/lib/request-url";

/**
 * Paynow's resulturl callback — server-to-server, not the customer's
 * browser (that lands on /quote/return separately). Always responds 200
 * unless the signature is invalid, per Paynow's guidance: a non-200
 * response makes Paynow retry the callback repeatedly.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const baseUrl = getBaseUrl(request);

  let status;
  try {
    status = verifyPaynowCallback(baseUrl, rawBody);
  } catch (err) {
    console.error("Paynow webhook: hash verification failed", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    if (PAYNOW_PAID_STATUSES.includes(status.status)) {
      await activatePaidPayment(
        status.reference,
        status.paynowReference,
        status as unknown as Record<string, unknown>,
        baseUrl
      );
    } else if (PAYNOW_FAILED_STATUSES.includes(status.status)) {
      await markPaymentFailed(status.reference, status as unknown as Record<string, unknown>);
    }
    // Anything else ("created", "sent") is still in flight — leave the
    // payment pending so the return page keeps polling for the real outcome.
  } catch (err) {
    // Log and still 200 — Paynow isn't responsible for retrying our DB
    // errors; the status-poll fallback in /api/checkout/paynow/status
    // reconciles from Paynow's own pollUrl independently.
    console.error("Paynow webhook: fulfillment failed", err);
  }

  return NextResponse.json({ received: true });
}
