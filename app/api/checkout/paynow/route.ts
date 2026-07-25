import { NextResponse } from "next/server";
import { isPaynowConfigured, initiatePaynowCheckout } from "@/lib/payment-gateways/paynow";
import { isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import {
  createPendingCheckout,
  storePaynowPollUrl,
  type CheckoutRequest,
} from "@/lib/payment-gateways/fulfillment";
import { getBaseUrl } from "@/lib/request-url";

/**
 * Requests a Paynow hosted checkout session. This app never touches card
 * or mobile money details: it persists the pending purchase, asks Paynow
 * for a browserurl, and hands that URL back so the client can do a full
 * page redirect. Paynow's own page takes payment; we only learn the
 * outcome afterwards via the webhook / status poll.
 */
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured() || !isPaynowConfigured()) {
    return NextResponse.json(
      {
        error: "not_configured",
        message: "Live payments are not fully configured yet.",
      },
      { status: 503 }
    );
  }

  let body: CheckoutRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!body.reference || !body.totalAmount || !body.leader?.email || !body.productId) {
    return NextResponse.json(
      { error: "invalid_request", message: "Missing required checkout fields" },
      { status: 400 }
    );
  }

  try {
    await createPendingCheckout(body);

    const description =
      body.travellers.length > 0
        ? `Zim Travelmate visitor insurance — ${body.travellers.length + 1} travellers`
        : "Zim Travelmate visitor insurance";

    const { redirectUrl, pollUrl } = await initiatePaynowCheckout({
      baseUrl: getBaseUrl(request),
      reference: body.reference,
      amount: body.totalAmount,
      description,
      email: body.leader.email,
    });

    if (pollUrl) await storePaynowPollUrl(body.reference, pollUrl);

    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error("Paynow checkout failed", err);
    return NextResponse.json(
      {
        error: "checkout_failed",
        message: err instanceof Error ? err.message : "Checkout failed",
      },
      { status: 502 }
    );
  }
}
