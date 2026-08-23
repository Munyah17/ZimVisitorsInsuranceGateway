/**
 * WhatsApp Business Cloud API webhook.
 *
 * GET  — Meta's one-time verification handshake when you save the webhook
 *        URL in the dashboard (Meta app -> WhatsApp -> Configuration).
 * POST — every inbound message. Meta expects a fast 200 response; we do
 *        the real work (bot engine, DB writes, Paynow call) before
 *        replying via the Graph API, then ack Meta with an empty 200.
 *
 * Setup checklist (Meta for Developers -> your app -> WhatsApp -> API Setup
 * / Configuration):
 *   1. WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID — from API Setup.
 *   2. WHATSAPP_VERIFY_TOKEN — any string you choose.
 *   3. Webhook URL: https://<your-domain>/api/webhooks/whatsapp
 *      Verify token: the same WHATSAPP_VERIFY_TOKEN value.
 *   4. Subscribe to the "messages" field.
 *   5. Add your own number as a tester (test numbers) to try it instantly —
 *      no business verification needed for that.
 */

import { NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/whatsapp/bot";
import { sendWhatsAppText } from "@/lib/whatsapp/client";
import { getBaseUrl } from "@/lib/request-url";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "verification_failed" }, { status: 403 });
}

interface WhatsAppMessage {
  from: string;
  type: string;
  text?: { body: string };
  interactive?: { button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
  image?: { id: string; mime_type: string };
  document?: { id: string; mime_type: string };
  audio?: { id: string; mime_type: string };
}

function extractText(m: WhatsAppMessage): string {
  if (m.type === "text") return m.text?.body ?? "";
  if (m.type === "interactive") {
    return m.interactive?.button_reply?.id ?? m.interactive?.list_reply?.id ?? "";
  }
  return "";
}

function extractMedia(m: WhatsAppMessage): { mediaId?: string; mediaMimeType?: string } {
  if (m.type === "image" && m.image) return { mediaId: m.image.id, mediaMimeType: m.image.mime_type };
  if (m.type === "document" && m.document) return { mediaId: m.document.id, mediaMimeType: m.document.mime_type };
  return {};
}

export async function POST(request: Request) {
  const baseUrl = getBaseUrl(request);
  const body = await request.json().catch(() => null);

  const messages: WhatsAppMessage[] =
    body?.entry?.flatMap((e: { changes?: { value?: { messages?: WhatsAppMessage[] } }[] }) =>
      e.changes?.flatMap((c) => c.value?.messages ?? []) ?? []
    ) ?? [];

  for (const message of messages) {
    const { mediaId, mediaMimeType } = extractMedia(message);
    try {
      const replies = await handleIncomingMessage({
        waId: message.from,
        text: extractText(message),
        mediaId,
        mediaMimeType,
        baseUrl,
      });
      for (const reply of replies) {
        await sendWhatsAppText(message.from, reply);
      }
    } catch (err) {
      console.error("WhatsApp message handling failed", err);
      await sendWhatsAppText(
        message.from,
        "Something went wrong on our end. Please try again, or contact support on +263 78 000 1111."
      ).catch(() => {});
    }
  }

  // Always 200 — Meta retries (and eventually disables the webhook) on
  // anything else, even if the "failure" was just one bad message.
  return NextResponse.json({ ok: true });
}
