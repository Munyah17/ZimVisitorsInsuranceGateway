/**
 * Server-only Paynow Zimbabwe integration.
 *
 * Wraps the official `paynow` npm SDK (SHA512 request/response signing,
 * hosted-checkout redirect flow). Import this ONLY from Route Handlers
 * (app/api/**\/route.ts) — PAYNOW_INTEGRATION_KEY must never reach the
 * browser bundle.
 *
 * This app never collects or processes card, EcoCash or OneMoney details
 * itself. We request a checkout session; Paynow's own hosted page (on
 * paynow.co.zw) takes payment details directly from the customer; we only
 * ever see a signed status update afterwards.
 */

import { Paynow } from "paynow";

export function isPaynowConfigured(): boolean {
  return Boolean(process.env.PAYNOW_INTEGRATION_ID && process.env.PAYNOW_INTEGRATION_KEY);
}

/** @param baseUrl e.g. "https://zim-travelmate.vercel.app" (no trailing slash) */
function createClient(baseUrl: string): Paynow {
  const integrationId = process.env.PAYNOW_INTEGRATION_ID;
  const integrationKey = process.env.PAYNOW_INTEGRATION_KEY;
  if (!integrationId || !integrationKey) {
    throw new Error(
      "Paynow is not configured: set PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY"
    );
  }
  return new Paynow(
    integrationId,
    integrationKey,
    `${baseUrl}/api/webhooks/paynow`, // resulturl — Paynow POSTs the status here
    `${baseUrl}/quote/return` // returnurl — the customer's browser lands here
  );
}

export interface PaynowCheckoutResult {
  redirectUrl: string;
  pollUrl: string;
}

/**
 * Requests a hosted checkout session for a full-redirect payment. Paynow
 * returns a browserurl; the caller is responsible for sending the customer
 * there with a full navigation (never an iframe — Paynow's own guidance).
 */
export async function initiatePaynowCheckout(params: {
  baseUrl: string;
  reference: string;
  amount: number;
  description: string;
  email: string;
}): Promise<PaynowCheckoutResult> {
  const paynow = createClient(params.baseUrl);
  const payment = paynow.createPayment(params.reference, params.email);
  payment.add(params.description, params.amount);

  const response = await paynow.send(payment);
  if (!response || !response.success || !response.redirectUrl) {
    throw new Error(
      response?.error ? String(response.error) : "Paynow declined the checkout request"
    );
  }
  return {
    redirectUrl: String(response.redirectUrl),
    pollUrl: String(response.pollUrl ?? ""),
  };
}

export interface PaynowStatus {
  reference: string;
  paynowReference: string;
  amount: string;
  /** Lowercased, e.g. "paid", "cancelled", "created", "awaiting delivery". */
  status: string;
}

function toStatus(raw: Record<string, unknown>): PaynowStatus {
  return {
    reference: String(raw.reference ?? ""),
    paynowReference: String(raw.paynowReference ?? ""),
    amount: String(raw.amount ?? ""),
    status: String(raw.status ?? "").toLowerCase(),
  };
}

/** Statuses that mean funds have actually been received. */
export const PAYNOW_PAID_STATUSES = ["paid", "awaiting delivery", "delivered"];

/**
 * Verifies and parses Paynow's resulturl webhook POST body (raw
 * application/x-www-form-urlencoded text). Throws on a hash mismatch —
 * never trust an unverified callback; anyone can POST to a public URL.
 */
export function verifyPaynowCallback(baseUrl: string, rawBody: string): PaynowStatus {
  const paynow = createClient(baseUrl);
  const parsed = paynow.parseStatusUpdate(rawBody);
  return toStatus(parsed as unknown as Record<string, unknown>);
}

/**
 * Independently asks Paynow for a transaction's status via its pollUrl —
 * Paynow's recommended source of truth, since resulturl delivery to the
 * merchant isn't guaranteed. Used as a fallback when the customer's browser
 * returns before (or without) a webhook having landed.
 */
export async function pollPaynowStatus(baseUrl: string, pollUrl: string): Promise<PaynowStatus> {
  const res = await fetch(pollUrl, { method: "POST" });
  const text = await res.text();
  const paynow = createClient(baseUrl);
  const parsed = paynow.parseStatusUpdate(text);
  return toStatus(parsed as unknown as Record<string, unknown>);
}
