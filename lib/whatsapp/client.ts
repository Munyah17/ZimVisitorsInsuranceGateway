/**
 * WhatsApp Business Cloud API — thin wrapper. Server-only: the access
 * token must never reach the browser.
 *
 * Setup (Meta for Developers -> your app -> WhatsApp -> API Setup):
 *   WHATSAPP_ACCESS_TOKEN     temporary or permanent token
 *   WHATSAPP_PHONE_NUMBER_ID  the "Phone number ID" (not the phone number itself)
 *   WHATSAPP_VERIFY_TOKEN     any string you choose; entered again in the
 *                             Meta dashboard's webhook config so Meta can
 *                             prove the callback URL is really ours
 */

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

const GRAPH_VERSION = "v20.0";

function endpoint(): string {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
}

async function post(body: Record<string, unknown>) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("WhatsApp is not configured: set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID");

  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("WhatsApp send failed", res.status, text);
  }
}

/** Plain text reply. */
export async function sendWhatsAppText(to: string, body: string) {
  await post({ to, type: "text", text: { body } });
}

/**
 * A tappable list of quick replies (Meta calls these "reply buttons") —
 * max 3 per message, short labels only. Used for the main menu and other
 * short choices; longer menus fall back to numbered plain text.
 */
export async function sendWhatsAppButtons(
  to: string,
  body: string,
  buttons: { id: string; title: string }[]
) {
  await post({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

/**
 * Downloads a media attachment (photo/document) a user sent, so it can be
 * re-uploaded to Supabase Storage. Two-step per Meta's API: resolve the
 * media id to a temporary CDN URL, then fetch the bytes with the same
 * bearer token.
 */
export async function downloadWhatsAppMedia(
  mediaId: string
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) return null;

  const metaRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) return null;
  const meta = await metaRes.json();
  if (!meta.url) return null;

  const fileRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } });
  if (!fileRes.ok) return null;

  return {
    bytes: new Uint8Array(await fileRes.arrayBuffer()),
    mimeType: meta.mime_type ?? "application/octet-stream",
  };
}
