import { NextResponse } from "next/server";
import { pollPaynowStatus, PAYNOW_PAID_STATUSES } from "@/lib/payment-gateways/paynow";
import {
  getCheckoutStatus,
  activatePaidPayment,
  markPaymentFailed,
} from "@/lib/payment-gateways/fulfillment";
import { isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { getBaseUrl } from "@/lib/request-url";

/**
 * Polled by the /quote/return page after the customer's browser comes back
 * from Paynow. Returns our own DB's view first; if it's still "pending"
 * (the webhook may not have landed yet — resulturl delivery isn't
 * guaranteed), falls back to asking Paynow directly via the stored
 * pollUrl, which is Paynow's own recommended source of truth.
 */
export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "missing_reference" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ status: "not_found", policies: [] });
  }

  try {
    let result = await getCheckoutStatus(reference);

    if (result.status === "pending" && result.pollUrl) {
      try {
        const live = await pollPaynowStatus(getBaseUrl(request), result.pollUrl);
        if (PAYNOW_PAID_STATUSES.includes(live.status)) {
          await activatePaidPayment(
            live.reference,
            live.paynowReference,
            live as unknown as Record<string, unknown>
          );
          result = await getCheckoutStatus(reference);
        } else if (["cancelled", "disputed"].includes(live.status)) {
          await markPaymentFailed(live.reference, live as unknown as Record<string, unknown>);
          result = await getCheckoutStatus(reference);
        }
      } catch (err) {
        console.error("Paynow status poll failed", err);
        // Fall through with whatever getCheckoutStatus already returned.
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Checkout status lookup failed", err);
    return NextResponse.json({ status: "not_found", policies: [] }, { status: 200 });
  }
}
