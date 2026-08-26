/**
 * Server-only fulfillment logic shared by the Paynow webhook and the
 * checkout status poll fallback.
 *
 * Two phases:
 *  1. createPendingCheckout() — persists customers, travel_details, one
 *     quote and one pending_payment policy PER traveller, plus one
 *     `initiated` payment row, BEFORE the customer is ever sent to Paynow.
 *     If Paynow's redirect never returns, nothing is silently lost.
 *  2. activatePaidPayment() / markPaymentFailed() — called from the webhook
 *     AND the status-poll fallback (both may fire for the same payment;
 *     both are idempotent — a payment already `succeeded` is left alone).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY. See lib/supabase-admin.ts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { findSessionByPendingReference, saveSession } from "@/lib/whatsapp/session";
import { sendWhatsAppText, isWhatsAppConfigured } from "@/lib/whatsapp/client";

/** Motions Microinsurance — seeded primary underwriter (schema.sql). */
const UNDERWRITER_ORG_ID = "22222222-2222-2222-2222-222222222222";

export interface CheckoutTraveller {
  fullName: string;
  nationality: string;
  dateOfBirth: string; // ISO date
  passportNumber: string;
  email: string;
  phone: string;
}

export interface CheckoutRequest {
  reference: string;
  productId: string;
  arrivalDate: string;
  departureDate: string;
  purpose: string;
  destination: string;
  activities: string[];
  leader: CheckoutTraveller;
  /** Additional group members — excludes the leader. */
  travellers: CheckoutTraveller[];
  pricingBreakdown: Record<string, unknown> & { premium: number };
  totalAmount: number;
  /** Which surface this checkout started from. Defaults to "web". */
  channel?: "web" | "whatsapp";
  /** Customer's preferred insurer (organizations.id). Falls back to Motions if unset/invalid. */
  insurerId?: string | null;
}

/** Validates the customer's chosen insurer is a real, active insurer org; falls back to Motions otherwise. */
async function resolveInsurer(sb: SupabaseClient, insurerId: string | null | undefined): Promise<string> {
  if (!insurerId) return UNDERWRITER_ORG_ID;
  const { data } = await sb
    .from("organizations")
    .select("id")
    .eq("id", insurerId)
    .in("type", ["microinsurer", "partner_insurer"])
    .eq("status", "active")
    .maybeSingle();
  return data?.id ?? UNDERWRITER_ORG_ID;
}

function generatePolicyNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(10000 + Math.random() * 89999);
  return `ZVIG-${year}-${seq}`;
}

async function insertCustomer(sb: SupabaseClient, t: CheckoutTraveller): Promise<string> {
  // If this traveller's email matches a registered account, link the new
  // customer row back to it (customers.user_id) so the customer portal can
  // find their policies directly, and backfill any account-level identity
  // fields (nationality/passport/phone) that are still empty from signup.
  const { data: matchingUser } = await sb
    .from("users")
    .select("id, country, passport_number, phone")
    .ilike("email", t.email)
    .eq("role", "customer")
    .maybeSingle();

  const { data, error } = await sb
    .from("customers")
    .insert({
      user_id: matchingUser?.id ?? null,
      full_name: t.fullName,
      nationality: t.nationality,
      // The wizard collects one passport-country-equivalent field
      // ("Nationality, as shown in passport"); mirrored here.
      passport_country: t.nationality,
      passport_number: t.passportNumber,
      date_of_birth: t.dateOfBirth,
      email: t.email,
      phone: t.phone,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to save traveller ${t.fullName}: ${error.message}`);

  if (matchingUser && (!matchingUser.country || !matchingUser.passport_number || !matchingUser.phone)) {
    await sb
      .from("users")
      .update({
        country: matchingUser.country ?? t.nationality,
        passport_number: matchingUser.passport_number ?? t.passportNumber,
        phone: matchingUser.phone ?? t.phone,
      })
      .eq("id", matchingUser.id);
  }

  return data.id as string;
}

async function insertTravelDetails(
  sb: SupabaseClient,
  customerId: string,
  req: CheckoutRequest
): Promise<string> {
  const { data, error } = await sb
    .from("travel_details")
    .insert({
      customer_id: customerId,
      arrival_date: req.arrivalDate,
      departure_date: req.departureDate,
      purpose: req.purpose,
      destination: req.destination,
      activities: req.activities,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to save travel details: ${error.message}`);
  return data.id as string;
}

async function insertPolicy(
  sb: SupabaseClient,
  args: {
    customerId: string;
    travelDetailId: string;
    productId: string;
    quoteId: string;
    startDate: string;
    endDate: string;
    premium: number;
    channel: "web" | "whatsapp";
    underwriterId: string;
  }
): Promise<{ id: string; policy_number: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await sb
      .from("policies")
      .insert({
        policy_number: generatePolicyNumber(),
        quote_id: args.quoteId,
        customer_id: args.customerId,
        travel_detail_id: args.travelDetailId,
        product_id: args.productId,
        underwriter_id: args.underwriterId,
        start_date: args.startDate,
        end_date: args.endDate,
        premium: args.premium,
        status: "pending_payment",
        channel: args.channel,
      })
      .select("id, policy_number")
      .single();
    if (!error) return data;
    if (error.code !== "23505") throw new Error(`Failed to create policy: ${error.message}`);
    // Unique violation on policy_number — regenerate and retry.
  }
  throw new Error("Could not generate a unique policy number after several attempts");
}

export interface PendingCheckout {
  quoteId: string;
  paymentId: string;
  policyIds: string[];
}

export async function createPendingCheckout(req: CheckoutRequest): Promise<PendingCheckout> {
  const sb = getSupabaseAdmin();
  const allTravellers = [req.leader, ...req.travellers];
  const perTravellerPremium =
    Math.round((req.pricingBreakdown.premium / allTravellers.length) * 100) / 100;

  const underwriterId = await resolveInsurer(sb, req.insurerId);

  const leaderCustomerId = await insertCustomer(sb, req.leader);
  const leaderTravelDetailId = await insertTravelDetails(sb, leaderCustomerId, req);

  const { data: quote, error: quoteError } = await sb
    .from("quotes")
    .insert({
      quote_number: req.reference,
      customer_id: leaderCustomerId,
      travel_detail_id: leaderTravelDetailId,
      product_id: req.productId,
      pricing_breakdown: req.pricingBreakdown,
      calculated_price: req.totalAmount,
      status: "priced",
    })
    .select("id")
    .single();
  if (quoteError) throw new Error(`Failed to create quote: ${quoteError.message}`);

  const policyIds: string[] = [];
  let leaderPolicyId = "";

  for (const traveller of allTravellers) {
    const isLeader = traveller === req.leader;
    const customerId = isLeader ? leaderCustomerId : await insertCustomer(sb, traveller);
    const travelDetailId = isLeader
      ? leaderTravelDetailId
      : await insertTravelDetails(sb, customerId, req);

    const policy = await insertPolicy(sb, {
      customerId,
      travelDetailId,
      productId: req.productId,
      quoteId: quote.id,
      startDate: req.arrivalDate,
      endDate: req.departureDate,
      premium: perTravellerPremium,
      channel: req.channel ?? "web",
      underwriterId,
    });
    policyIds.push(policy.id);
    if (isLeader) leaderPolicyId = policy.id;
  }

  const { data: payment, error: paymentError } = await sb
    .from("payments")
    .insert({
      policy_id: leaderPolicyId,
      quote_id: quote.id,
      customer_id: leaderCustomerId,
      amount: req.totalAmount,
      provider: "paynow",
      transaction_reference: req.reference,
      status: "initiated",
    })
    .select("id")
    .single();
  if (paymentError) throw new Error(`Failed to create payment record: ${paymentError.message}`);

  return { quoteId: quote.id, paymentId: payment.id, policyIds };
}

export async function storePaynowPollUrl(reference: string, pollUrl: string) {
  const sb = getSupabaseAdmin();
  await sb.from("payments").update({ poll_url: pollUrl }).eq("transaction_reference", reference);
}

export interface IssuedPolicySummary {
  policyNumber: string;
  holderName: string;
  startDate: string;
  endDate: string;
}

export interface CheckoutStatusResult {
  status: "succeeded" | "failed" | "pending" | "not_found";
  policies: IssuedPolicySummary[];
  pollUrl?: string;
}

async function fetchPoliciesForQuote(
  sb: SupabaseClient,
  quoteId: string
): Promise<IssuedPolicySummary[]> {
  const { data } = await sb
    .from("policies")
    .select("policy_number, start_date, end_date, customers(full_name)")
    .eq("quote_id", quoteId);

  return (data ?? []).map((p) => {
    const customer = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    return {
      policyNumber: p.policy_number as string,
      holderName: (customer?.full_name as string) ?? "",
      startDate: p.start_date as string,
      endDate: p.end_date as string,
    };
  });
}

export async function getCheckoutStatus(reference: string): Promise<CheckoutStatusResult> {
  const sb = getSupabaseAdmin();
  const { data: payment } = await sb
    .from("payments")
    .select("status, quote_id, poll_url")
    .eq("transaction_reference", reference)
    .maybeSingle();

  if (!payment) return { status: "not_found", policies: [] };
  if (payment.status === "succeeded") {
    return { status: "succeeded", policies: await fetchPoliciesForQuote(sb, payment.quote_id) };
  }
  if (payment.status === "failed") {
    return { status: "failed", policies: [] };
  }
  return { status: "pending", policies: [], pollUrl: payment.poll_url ?? undefined };
}

/** Idempotent — safe to call from both the webhook and the poll fallback. */
export async function activatePaidPayment(
  reference: string,
  paynowReference: string,
  rawPayload: Record<string, unknown>,
  baseUrl?: string
) {
  const sb = getSupabaseAdmin();
  const { data: payment } = await sb
    .from("payments")
    .select("id, status, quote_id")
    .eq("transaction_reference", reference)
    .maybeSingle();
  if (!payment) throw new Error(`No payment found for reference ${reference}`);
  if (payment.status === "succeeded") return;

  await sb
    .from("payments")
    .update({
      status: "succeeded",
      provider_payload: { ...rawPayload, paynowReference },
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  await sb.from("policies").update({ status: "active" }).eq("quote_id", payment.quote_id);
  await sb.from("quotes").update({ status: "converted" }).eq("id", payment.quote_id);

  await sb.from("audit_logs").insert({
    action: "payment.succeeded",
    entity: "payments",
    entity_id: payment.id,
    new_value: { status: "succeeded", reference, paynowReference },
  });

  if (baseUrl) await notifyWhatsAppOfPayment(reference, payment.quote_id, baseUrl);
}

/**
 * If this payment was started from the WhatsApp bot (a whatsapp_sessions
 * row has pending_reference = reference), message the buyer back with
 * their certificate the moment Paynow confirms payment — the same
 * activation this function just did, just also surfaced where they asked
 * for it, without them having to check back on the site.
 */
async function notifyWhatsAppOfPayment(reference: string, quoteId: string, baseUrl: string) {
  if (!isWhatsAppConfigured()) return;
  const session = await findSessionByPendingReference(reference);
  if (!session) return;

  const sb = getSupabaseAdmin();
  const policies = await fetchPoliciesForQuote(sb, quoteId);

  const lines = policies.map(
    (p) => `• ${p.policyNumber} (${p.holderName})\n  Certificate: ${baseUrl}/api/certificate/${encodeURIComponent(p.policyNumber)}`
  );

  await sendWhatsAppText(
    session.waId,
    `✅ Payment confirmed — you're covered!\n\n${lines.join("\n\n")}\n\nType MENU for other options.`
  ).catch((err) => console.error("WhatsApp payment notification failed", err));

  await saveSession({ ...session, state: "MAIN_MENU", pendingReference: null, draft: {} }).catch(() => {});
}

/** Idempotent — never downgrades an already-succeeded payment. */
export async function markPaymentFailed(reference: string, rawPayload: Record<string, unknown>) {
  const sb = getSupabaseAdmin();
  const { data: payment } = await sb
    .from("payments")
    .select("id, status")
    .eq("transaction_reference", reference)
    .maybeSingle();
  if (!payment || payment.status === "succeeded") return;

  await sb
    .from("payments")
    .update({ status: "failed", provider_payload: rawPayload, updated_at: new Date().toISOString() })
    .eq("id", payment.id);
}
