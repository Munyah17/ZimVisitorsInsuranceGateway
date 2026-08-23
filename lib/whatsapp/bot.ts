/**
 * WhatsApp bot conversation engine.
 *
 * Deliberately NOT a simulation: every action here calls the exact same
 * server-side functions the website uses (createPendingCheckout,
 * initiatePaynowCheckout, the claims table, fetchLivePolicy). A policy
 * bought over WhatsApp is the same real row, same real Paynow charge, as
 * one bought on the site — the chat is just a different front door.
 *
 * State machine: one step per incoming message, persisted in
 * whatsapp_sessions (lib/whatsapp/session.ts) so a conversation survives
 * across separate webhook calls (WhatsApp messaging has no session of
 * its own — each message is an independent HTTP POST to us).
 */

import { PRODUCTS, TRAVEL_PURPOSES, ACTIVITIES, type ActivityId } from "@/lib/mock-data";
import { COUNTRIES } from "@/lib/countries";
import { DESTINATIONS } from "@/lib/partners-data";
import { calculatePremium } from "@/lib/quote-engine";
import { createPendingCheckout, storePaynowPollUrl, type CheckoutRequest } from "@/lib/payment-gateways/fulfillment";
import { initiatePaynowCheckout, isPaynowConfigured } from "@/lib/payment-gateways/paynow";
import { fetchLivePolicy } from "@/lib/policy-lookup";
import { generateClaimNumber } from "@/lib/claims";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { downloadWhatsAppMedia } from "@/lib/whatsapp/client";
import { getSession, saveSession, type BotSession } from "@/lib/whatsapp/session";
import { formatDate, formatUSD } from "@/lib/utils";

const PRODUCT = PRODUCTS[0];

const MENU_TEXT =
  "*Zim Travelmate* 🇿🇼\n" +
  "How can I help?\n\n" +
  "1. Buy visitor cover\n" +
  "2. Verify a policy\n" +
  "3. My policies\n" +
  "4. Submit a claim\n" +
  "5. Emergency assistance\n" +
  "6. Service partners near me\n" +
  "7. Talk to a person\n\n" +
  "Reply with a number any time. Type MENU to come back here.";

const EMERGENCY_TEXT =
  "🚨 *Emergency Assistance*\n" +
  "24/7 line: +263 78 000 1111\n\n" +
  "If it's life-threatening, contact local emergency services first. " +
  "Have your policy number ready if you can.\n\n" +
  "Type MENU for other options.";

const HUMAN_TEXT =
  "I'll flag this for our support team, and someone will follow up here on WhatsApp shortly.\n" +
  "You can also reach us directly on +263 78 000 1111.\n\n" +
  "Type MENU for other options.";

function normalizePhone(waId: string): string {
  return waId.startsWith("+") ? waId : `+${waId}`;
}

function matchMenuChoice(text: string): string | null {
  const t = text.trim().toLowerCase();
  if (["1", "buy", "buy cover", "cover", "quote"].includes(t)) return "buy";
  if (["2", "verify", "verify policy"].includes(t)) return "verify";
  if (["3", "my policies", "mine", "policies"].includes(t)) return "mine";
  if (["4", "claim", "claims", "submit a claim"].includes(t)) return "claim";
  if (["5", "emergency", "sos", "help me"].includes(t)) return "emergency";
  if (["6", "partners", "service partners"].includes(t)) return "partners";
  if (["7", "human", "agent", "support", "talk to a person"].includes(t)) return "human";
  return null;
}

function isMenuCommand(text: string): boolean {
  return ["menu", "cancel", "0", "back", "hi", "hello", "hie", "start"].includes(text.trim().toLowerCase());
}

function matchCountry(input: string): { match?: string; suggestions: string[] } {
  const q = input.trim().toLowerCase();
  if (!q) return { suggestions: [] };
  const exact = COUNTRIES.find((c) => c.toLowerCase() === q);
  if (exact) return { match: exact, suggestions: [] };
  const contains = COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  if (contains.length === 1) return { match: contains[0], suggestions: [] };
  return { suggestions: contains.slice(0, 6) };
}

function parseDate(input: string): string | null {
  const t = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : t;
}

function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

interface IncomingMessage {
  waId: string;
  text: string;
  mediaId?: string;
  mediaMimeType?: string;
  baseUrl: string;
}

export async function handleIncomingMessage(msg: IncomingMessage): Promise<string[]> {
  const session = await getSession(msg.waId);
  const text = msg.text ?? "";

  // MENU/CANCEL always wins and returns to the top menu. pendingReference
  // is deliberately left untouched here (not cleared) so a payment that
  // was started before navigating away still gets confirmed by WhatsApp
  // later, from notifyWhatsAppOfPayment() in fulfillment.ts.
  if (isMenuCommand(text)) {
    session.state = "MAIN_MENU";
    session.draft = {};
    await saveSession(session);
    return [MENU_TEXT];
  }

  if (session.state === "MAIN_MENU") {
    return handleMenu(session, text);
  }

  if (session.state.startsWith("BUY_")) {
    return handleBuyFlow(session, text, msg.baseUrl);
  }

  if (session.state === "VERIFY_AWAITING_NUMBER") {
    return handleVerify(session, text);
  }

  if (session.state.startsWith("CLAIM_")) {
    return handleClaimFlow(session, text, msg.mediaId, msg.mediaMimeType);
  }

  if (session.state === "PARTNERS_AWAITING_CITY") {
    return handlePartners(session, text);
  }

  // Fallback: shouldn't normally be reached.
  session.state = "MAIN_MENU";
  await saveSession(session);
  return [MENU_TEXT];
}

async function handleMenu(session: BotSession, text: string): Promise<string[]> {
  const choice = matchMenuChoice(text);
  switch (choice) {
    case "buy":
      session.state = "BUY_NAME";
      session.draft = {};
      await saveSession(session);
      return ["Let's get you covered. What's your full name, exactly as shown on your passport?"];
    case "verify":
      session.state = "VERIFY_AWAITING_NUMBER";
      await saveSession(session);
      return ["What's the policy number? e.g. ZVIG-2026-00001"];
    case "mine":
      return [...(await listMyPolicies(session.waId)), MENU_TEXT];
    case "claim":
      session.state = "CLAIM_AWAITING_POLICY";
      session.draft = {};
      await saveSession(session);
      return ["Sorry to hear that. What's the policy number this claim is against?"];
    case "emergency":
      return [EMERGENCY_TEXT];
    case "partners":
      session.state = "PARTNERS_AWAITING_CITY";
      await saveSession(session);
      return ["Which city or area? (e.g. Victoria Falls, Harare, Bulawayo...) Type ANY for nationwide options."];
    case "human":
      return [HUMAN_TEXT];
    default:
      return ["Sorry, I didn't catch that.\n\n" + MENU_TEXT];
  }
}

async function listMyPolicies(waId: string): Promise<string[]> {
  const admin = getSupabaseAdmin();
  const phone = normalizePhone(waId);
  const { data } = await admin
    .from("customers")
    .select("policies(policy_number, status, start_date, end_date)")
    .eq("phone", phone);

  const policies = (data ?? []).flatMap((c) => (Array.isArray(c.policies) ? c.policies : c.policies ? [c.policies] : []));

  if (policies.length === 0) {
    return ["I couldn't find any policies bought from this WhatsApp number. Reply 1 to buy cover."];
  }

  const lines = policies.map(
    (p: { policy_number: string; status: string; start_date: string; end_date: string }) =>
      `• ${p.policy_number} — ${p.status.toUpperCase()} (${formatDate(p.start_date)} to ${formatDate(p.end_date)})`
  );
  return [`Your policies:\n\n${lines.join("\n")}`];
}

async function handleVerify(session: BotSession, text: string): Promise<string[]> {
  session.state = "MAIN_MENU";
  await saveSession(session);

  const policy = await fetchLivePolicy(text).catch(() => null);
  if (!policy) {
    return [
      `No policy matches "${text.trim()}". Check the number and try again, or contact support on +263 78 000 1111.`,
      MENU_TEXT,
    ];
  }

  const status = policy.status === "active" ? "VALID ✅" : policy.status.replace(/_/g, " ").toUpperCase();
  return [
    `*${status}*\n` +
      `Policyholder: ${policy.holderName}\n` +
      `Nationality: ${policy.nationality}\n` +
      `Valid until: ${formatDate(policy.endDate)}\n` +
      `Coverage: ${policy.coverageSummary}`,
    MENU_TEXT,
  ];
}

async function handlePartners(session: BotSession, text: string): Promise<string[]> {
  session.state = "MAIN_MENU";
  await saveSession(session);

  const admin = getSupabaseAdmin();
  const city = text.trim();
  const query = admin
    .from("service_partners")
    .select("name, category, city, phone, open_24h")
    .eq("active", true)
    .limit(6);

  const { data } =
    city.toLowerCase() === "any"
      ? await query
      : await query.or(`city.ilike.%${city}%,city.eq.Nationwide`);

  if (!data || data.length === 0) {
    return [`No listed partners near "${city}" yet. Try a nearby city, or type ANY for nationwide options.`, MENU_TEXT];
  }

  const lines = data.map(
    (p) => `• *${p.name}* (${p.category})\n  ${p.city} · ${p.phone}${p.open_24h ? " · 24/7" : ""}`
  );
  return [`Service partners:\n\n${lines.join("\n\n")}`, MENU_TEXT];
}

async function handleBuyFlow(session: BotSession, text: string, baseUrl: string): Promise<string[]> {
  const draft = session.draft;

  switch (session.state) {
    case "BUY_NAME": {
      if (!text.trim()) return ["Please share your full name to continue."];
      draft.fullName = text.trim();
      session.state = "BUY_NATIONALITY";
      await saveSession(session);
      return ["Nationality, as shown in your passport?"];
    }

    case "BUY_NATIONALITY": {
      const { match, suggestions } = matchCountry(text);
      if (match) {
        draft.nationality = match;
        session.state = "BUY_DOB";
        await saveSession(session);
        return ["Date of birth? (YYYY-MM-DD)"];
      }
      if (suggestions.length > 0) {
        return [`Did you mean one of these?\n${suggestions.map((s) => `• ${s}`).join("\n")}\n\nReply with the exact name.`];
      }
      return ["I couldn't match that country. Please type it in English, e.g. \"United Kingdom\"."];
    }

    case "BUY_DOB": {
      const dob = parseDate(text);
      if (!dob) return ["Please use the format YYYY-MM-DD, e.g. 1990-05-21."];
      draft.dateOfBirth = dob;
      session.state = "BUY_PASSPORT";
      await saveSession(session);
      return ["Passport number?"];
    }

    case "BUY_PASSPORT": {
      if (!text.trim()) return ["Please share your passport number."];
      draft.passportNumber = text.trim();
      session.state = "BUY_EMAIL";
      await saveSession(session);
      return ["Email address, for your certificate and receipt?"];
    }

    case "BUY_EMAIL": {
      if (!isValidEmail(text)) return ["That doesn't look like a valid email. Please try again."];
      draft.email = text.trim();
      session.state = "BUY_ARRIVAL";
      await saveSession(session);
      return ["Arrival date in Zimbabwe? (YYYY-MM-DD)"];
    }

    case "BUY_ARRIVAL": {
      const d = parseDate(text);
      if (!d) return ["Please use the format YYYY-MM-DD."];
      draft.arrivalDate = d;
      session.state = "BUY_DEPARTURE";
      await saveSession(session);
      return ["Departure date? (YYYY-MM-DD)"];
    }

    case "BUY_DEPARTURE": {
      const d = parseDate(text);
      if (!d) return ["Please use the format YYYY-MM-DD."];
      if (draft.arrivalDate && d < draft.arrivalDate) {
        return ["Departure date can't be before your arrival date. Please try again."];
      }
      draft.departureDate = d;
      session.state = "BUY_DESTINATION";
      await saveSession(session);
      return [
        "Main destination?\n" + DESTINATIONS.map((d2) => `• ${d2.label}`).join("\n") + "\n\nReply with one, or type your own.",
      ];
    }

    case "BUY_DESTINATION": {
      if (!text.trim()) return ["Please share your main destination."];
      draft.destination = text.trim();
      session.state = "BUY_PURPOSE";
      await saveSession(session);
      return [
        "Purpose of travel?\n" +
          TRAVEL_PURPOSES.map((p, i) => `${i + 1}. ${p.label}`).join("\n") +
          "\n\nReply with a number.",
      ];
    }

    case "BUY_PURPOSE": {
      const idx = Number(text.trim()) - 1;
      const purpose = TRAVEL_PURPOSES[idx];
      if (!purpose) return ["Please reply with a number from the list."];
      draft.purpose = purpose.id;
      session.state = "BUY_ACTIVITIES";
      await saveSession(session);
      return [
        "Any of these planned?\n" +
          ACTIVITIES.map((a, i) => `${i + 1}. ${a.label} — ${a.hint}`).join("\n") +
          "\n\nReply with a number, or SKIP for general travel.",
      ];
    }

    case "BUY_ACTIVITIES": {
      let activityId: ActivityId = "general";
      if (text.trim().toLowerCase() !== "skip") {
        const idx = Number(text.trim()) - 1;
        const activity = ACTIVITIES[idx];
        if (!activity) return ["Please reply with a number from the list, or SKIP."];
        activityId = activity.id;
      }
      draft.activities = [activityId];

      const pricing = calculatePremium({
        product: PRODUCT,
        arrivalDate: draft.arrivalDate!,
        departureDate: draft.departureDate!,
        dateOfBirths: [draft.dateOfBirth!],
        activities: draft.activities as ActivityId[],
      });

      session.state = "BUY_CONFIRM";
      await saveSession(session);
      return [
        `*${PRODUCT.name}*\n` +
          `${draft.fullName}, ${pricing.days} day(s), ${formatDate(draft.arrivalDate!)} to ${formatDate(draft.departureDate!)}\n\n` +
          `Premium: ${formatUSD(pricing.premium)}\n` +
          `ZTA Levy: ${formatUSD(pricing.ztaLevy)}\n` +
          `Stamp Duty: ${formatUSD(pricing.stampDuty)}\n` +
          `Processing fee: ${formatUSD(pricing.platformFee)}\n` +
          `*Total: ${formatUSD(pricing.grandTotal)}*\n\n` +
          "Reply YES to get a secure payment link, or NO to cancel.",
      ];
    }

    case "BUY_CONFIRM": {
      const yes = ["yes", "y", "confirm", "pay"].includes(text.trim().toLowerCase());
      if (!yes) {
        session.state = "MAIN_MENU";
        session.draft = {};
        await saveSession(session);
        return ["No problem, cancelled. " + MENU_TEXT];
      }
      if (!isPaynowConfigured()) {
        session.state = "MAIN_MENU";
        await saveSession(session);
        return ["Payments aren't available right now. Please try again shortly or contact support on +263 78 000 1111."];
      }

      const pricing = calculatePremium({
        product: PRODUCT,
        arrivalDate: draft.arrivalDate!,
        departureDate: draft.departureDate!,
        dateOfBirths: [draft.dateOfBirth!],
        activities: draft.activities as ActivityId[],
      });

      const reference = `ZVIG-WA-${Date.now()}`;
      const req: CheckoutRequest = {
        reference,
        productId: PRODUCT.id,
        arrivalDate: draft.arrivalDate!,
        departureDate: draft.departureDate!,
        purpose: draft.purpose!,
        destination: draft.destination!,
        activities: draft.activities!,
        leader: {
          fullName: draft.fullName!,
          nationality: draft.nationality!,
          dateOfBirth: draft.dateOfBirth!,
          passportNumber: draft.passportNumber!,
          email: draft.email!,
          phone: normalizePhone(session.waId),
        },
        travellers: [],
        pricingBreakdown: { ...pricing },
        totalAmount: pricing.grandTotal,
      };

      try {
        await createPendingCheckout(req);
        const { redirectUrl, pollUrl } = await initiatePaynowCheckout({
          baseUrl,
          reference,
          amount: pricing.grandTotal,
          description: "Zim Travelmate visitor insurance — WhatsApp purchase",
          email: draft.email!,
        });
        if (pollUrl) await storePaynowPollUrl(reference, pollUrl);

        session.state = "BUY_AWAITING_PAYMENT";
        session.pendingReference = reference;
        await saveSession(session);

        return [
          `Tap this secure link to pay ${formatUSD(pricing.grandTotal)} by card, EcoCash or OneMoney:\n${redirectUrl}\n\n` +
            "As soon as Paynow confirms your payment, I'll message you here with your certificate.",
        ];
      } catch (err) {
        console.error("WhatsApp checkout failed", err);
        session.state = "MAIN_MENU";
        session.draft = {};
        await saveSession(session);
        return ["Something went wrong starting your payment. Please try again, or contact support on +263 78 000 1111."];
      }
    }

    case "BUY_AWAITING_PAYMENT": {
      return [
        "Your payment link is still open — I'll message you automatically the moment it's confirmed. " +
          "Type MENU if you'd like to do something else meanwhile (your payment will still go through).",
      ];
    }

    default:
      session.state = "MAIN_MENU";
      await saveSession(session);
      return [MENU_TEXT];
  }
}

async function findPolicyIdByNumber(policyNumber: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("policies")
    .select("id")
    .eq("policy_number", policyNumber.trim().toUpperCase())
    .maybeSingle();
  return data?.id ?? null;
}

const INCIDENT_TYPES = ["Medical expense", "Accident", "Travel disruption", "Other"];

async function handleClaimFlow(
  session: BotSession,
  text: string,
  mediaId: string | undefined,
  mediaMimeType: string | undefined
): Promise<string[]> {
  const draft = session.draft;

  switch (session.state) {
    case "CLAIM_AWAITING_POLICY": {
      const policyId = await findPolicyIdByNumber(text);
      if (!policyId) {
        return ["I couldn't find a policy with that number. Please check it and try again, or type MENU to cancel."];
      }
      draft.claimPolicyNumber = text.trim().toUpperCase();
      session.state = "CLAIM_AWAITING_TYPE";
      await saveSession(session);
      return ["What kind of incident?\n" + INCIDENT_TYPES.map((t, i) => `${i + 1}. ${t}`).join("\n") + "\n\nReply with a number."];
    }

    case "CLAIM_AWAITING_TYPE": {
      const idx = Number(text.trim()) - 1;
      const type = INCIDENT_TYPES[idx];
      if (!type) return ["Please reply with a number from the list."];
      draft.claimIncidentType = type;
      session.state = "CLAIM_AWAITING_DATE";
      await saveSession(session);
      return ["When did it happen? (YYYY-MM-DD)"];
    }

    case "CLAIM_AWAITING_DATE": {
      const d = parseDate(text);
      if (!d) return ["Please use the format YYYY-MM-DD."];
      draft.claimIncidentDate = d;
      session.state = "CLAIM_AWAITING_LOCATION";
      await saveSession(session);
      return ["Where did it happen? (e.g. Victoria Falls)"];
    }

    case "CLAIM_AWAITING_LOCATION": {
      if (!text.trim()) return ["Please share a location."];
      draft.claimLocation = text.trim();
      session.state = "CLAIM_AWAITING_DESCRIPTION";
      await saveSession(session);
      return ["Please describe what happened, any treatment received, and costs incurred."];
    }

    case "CLAIM_AWAITING_DESCRIPTION": {
      if (text.trim().length < 10) return ["Please add a little more detail (at least 10 characters)."];
      draft.claimDescription = text.trim();
      session.state = "CLAIM_CONFIRM";
      await saveSession(session);
      return [
        `*Claim summary*\n` +
          `Policy: ${draft.claimPolicyNumber}\n` +
          `Type: ${draft.claimIncidentType}\n` +
          `Date: ${formatDate(draft.claimIncidentDate!)}\n` +
          `Location: ${draft.claimLocation}\n` +
          `Description: ${draft.claimDescription}\n\n` +
          "Reply YES to submit, or NO to cancel.",
      ];
    }

    case "CLAIM_CONFIRM": {
      const yes = ["yes", "y", "confirm", "submit"].includes(text.trim().toLowerCase());
      if (!yes) {
        session.state = "MAIN_MENU";
        session.draft = {};
        await saveSession(session);
        return ["No problem, cancelled. " + MENU_TEXT];
      }

      const policyId = await findPolicyIdByNumber(draft.claimPolicyNumber!);
      if (!policyId) {
        session.state = "MAIN_MENU";
        session.draft = {};
        await saveSession(session);
        return ["That policy number is no longer valid. Please start again from the menu.", MENU_TEXT];
      }

      const claimNumber = generateClaimNumber();
      const admin = getSupabaseAdmin();
      const { error } = await admin.from("claims").insert({
        claim_number: claimNumber,
        policy_id: policyId,
        incident_date: draft.claimIncidentDate,
        description: draft.claimDescription,
        location: draft.claimLocation,
        documents: [],
      });

      if (error) {
        session.state = "MAIN_MENU";
        session.draft = {};
        await saveSession(session);
        return ["Something went wrong submitting your claim. Please try again, or contact support on +263 78 000 1111."];
      }

      session.state = "CLAIM_AWAITING_DOCS";
      session.activeClaimNumber = claimNumber;
      session.draft = {};
      await saveSession(session);
      return [
        `Claim submitted — number *${claimNumber}*. We'll email/WhatsApp you with updates.\n\n` +
          "You can now send photos or documents for this claim right here, or type DONE when finished.",
      ];
    }

    case "CLAIM_AWAITING_DOCS": {
      if (["done", "finished", "no"].includes(text.trim().toLowerCase())) {
        session.state = "MAIN_MENU";
        session.activeClaimNumber = null;
        await saveSession(session);
        return ["Got it — thanks! " + MENU_TEXT];
      }
      if (mediaId && session.activeClaimNumber) {
        const media = await downloadWhatsAppMedia(mediaId);
        if (!media) return ["I couldn't download that file. Please try sending it again."];

        const admin = getSupabaseAdmin();
        const ext = media.mimeType.includes("pdf") ? "pdf" : media.mimeType.split("/")[1] || "bin";
        const path = `${session.activeClaimNumber}/wa-${Date.now()}.${ext}`;
        const { error: uploadError } = await admin.storage.from("claims").upload(path, media.bytes, {
          contentType: media.mimeType,
        });
        if (uploadError) return ["That file couldn't be saved. Please try again."];

        const { data: claim } = await admin
          .from("claims")
          .select("documents")
          .eq("claim_number", session.activeClaimNumber)
          .maybeSingle();
        const documents = Array.isArray(claim?.documents) ? claim.documents : [];
        documents.push({ name: path.split("/").pop(), path });
        await admin.from("claims").update({ documents }).eq("claim_number", session.activeClaimNumber);

        return ["Got it, attached to your claim. Send more, or type DONE when finished."];
      }
      return ["Send a photo or document, or type DONE when finished."];
    }

    default:
      session.state = "MAIN_MENU";
      await saveSession(session);
      return [MENU_TEXT];
  }
}
