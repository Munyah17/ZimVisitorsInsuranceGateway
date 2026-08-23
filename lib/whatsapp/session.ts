/**
 * Conversation state for the WhatsApp bot — one row per WhatsApp sender,
 * in `whatsapp_sessions` (service role only, see supabase/schema.sql).
 * Everything is keyed by wa_id, WhatsApp's own phone-number identifier,
 * so a person's conversation naturally resumes wherever they left off.
 */

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type BotState =
  | "MAIN_MENU"
  | "BUY_NAME"
  | "BUY_NATIONALITY"
  | "BUY_DOB"
  | "BUY_PASSPORT"
  | "BUY_EMAIL"
  | "BUY_ARRIVAL"
  | "BUY_DEPARTURE"
  | "BUY_DESTINATION"
  | "BUY_PURPOSE"
  | "BUY_ACTIVITIES"
  | "BUY_CONFIRM"
  | "BUY_AWAITING_PAYMENT"
  | "VERIFY_AWAITING_NUMBER"
  | "MYPOLICIES"
  | "CLAIM_AWAITING_POLICY"
  | "CLAIM_AWAITING_TYPE"
  | "CLAIM_AWAITING_DATE"
  | "CLAIM_AWAITING_LOCATION"
  | "CLAIM_AWAITING_DESCRIPTION"
  | "CLAIM_CONFIRM"
  | "CLAIM_AWAITING_DOCS"
  | "PARTNERS_AWAITING_CITY";

export interface BotDraft {
  fullName?: string;
  nationality?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  email?: string;
  arrivalDate?: string;
  departureDate?: string;
  destination?: string;
  purpose?: string;
  activities?: string[];
  claimPolicyNumber?: string;
  claimIncidentType?: string;
  claimIncidentDate?: string;
  claimLocation?: string;
  claimDescription?: string;
}

export interface BotSession {
  waId: string;
  state: BotState;
  draft: BotDraft;
  pendingReference: string | null;
  activeClaimNumber: string | null;
}

function normalizeWaId(waId: string): string {
  return waId.replace(/[^0-9]/g, "");
}

export async function getSession(waId: string): Promise<BotSession> {
  const id = normalizeWaId(waId);
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("whatsapp_sessions")
    .select("wa_id, state, draft, pending_reference, active_claim_number")
    .eq("wa_id", id)
    .maybeSingle();

  if (data) {
    return {
      waId: data.wa_id,
      state: data.state as BotState,
      draft: (data.draft as BotDraft) ?? {},
      pendingReference: data.pending_reference,
      activeClaimNumber: data.active_claim_number,
    };
  }

  await admin.from("whatsapp_sessions").insert({ wa_id: id });
  return { waId: id, state: "MAIN_MENU", draft: {}, pendingReference: null, activeClaimNumber: null };
}

export async function saveSession(session: BotSession): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin
    .from("whatsapp_sessions")
    .update({
      state: session.state,
      draft: session.draft,
      pending_reference: session.pendingReference,
      active_claim_number: session.activeClaimNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("wa_id", session.waId);
}

export function resetToMenu(session: BotSession): BotSession {
  return { ...session, state: "MAIN_MENU", draft: {}, pendingReference: session.pendingReference };
}

/** Looked up by lib/payment-gateways/fulfillment.ts when a Paynow payment succeeds. */
export async function findSessionByPendingReference(reference: string): Promise<BotSession | null> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("whatsapp_sessions")
    .select("wa_id, state, draft, pending_reference, active_claim_number")
    .eq("pending_reference", reference)
    .maybeSingle();
  if (!data) return null;
  return {
    waId: data.wa_id,
    state: data.state as BotState,
    draft: (data.draft as BotDraft) ?? {},
    pendingReference: data.pending_reference,
    activeClaimNumber: data.active_claim_number,
  };
}
